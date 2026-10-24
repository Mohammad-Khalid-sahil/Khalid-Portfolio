'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');
const tls = require('node:tls');

const expectedBranch = 'diagnostic/atlas-tls';
const safeErrorCodes = new Set([
  'TIMEOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR', 'ERR_SSL_WRONG_VERSION_NUMBER',
  'ERR_SSL_UNSUPPORTED_PROTOCOL', 'ERR_TLS_CERT_ALTNAME_INVALID',
  'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT',
]);

function errorCode(error) {
  return safeErrorCodes.has(error && error.code) ? error.code : 'OTHER';
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), ms); }),
  ]).finally(() => clearTimeout(timer));
}

function socketResult(makeSocket, eventName, ms, authorizedOnly = false) {
  return new Promise((resolve) => {
    let done = false;
    let socket;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (socket) socket.destroy();
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, code: 'TIMEOUT' }), ms);
    try {
      socket = makeSocket();
      socket.once('error', (error) => finish({ ok: false, code: errorCode(error) }));
      socket.once(eventName, () => {
        if (authorizedOnly && !socket.authorized) return finish({ ok: false, code: 'CERTIFICATE_REJECTED' });
        finish({ ok: true, code: null });
      });
    } catch (error) {
      finish({ ok: false, code: errorCode(error) });
    }
  });
}

function summarize(results) {
  const codes = [...new Set(results.filter((item) => !item.ok).map((item) => item.code))];
  return { succeeded: results.filter((item) => item.ok).length, total: results.length, errorCodes: codes };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (process.env.VERCEL_ENV !== 'preview' || process.env.VERCEL_GIT_COMMIT_REF !== expectedBranch) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const seedHost = typeof req.query.host === 'string' ? req.query.host.toLowerCase().replace(/\.$/, '') : '';
  if (!/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.mongodb\.net$/.test(seedHost)) {
    return res.status(400).json({ error: 'Provide the Atlas SRV hostname (host only, no URI or credentials).' });
  }

  let records;
  try {
    records = await withTimeout(dns.resolveSrv(`_mongodb._tcp.${seedHost}`), 3000);
  } catch (error) {
    return res.status(200).json({ previewOnly: true, srv: { ok: false, count: 0, errorCode: errorCode(error) } });
  }
  const members = records.filter((record) => Number(record.port) === 27017 && record.name.endsWith('.mongodb.net'));
  if (!members.length) {
    return res.status(200).json({ previewOnly: true, srv: { ok: true, count: records.length }, validMemberCount: 0 });
  }

  const dnsResults = await Promise.all(members.map(async (record) => {
    try {
      const addresses = await withTimeout(dns.lookup(record.name.replace(/\.$/, ''), { all: true, verbatim: true }), 2500);
      return { ok: addresses.length > 0, code: addresses.length ? null : 'NO_ADDRESSES' };
    } catch (error) {
      return { ok: false, code: errorCode(error) };
    }
  }));

  const tcpPromise = Promise.all(members.map((record) => socketResult(
    () => net.createConnection({ host: record.name.replace(/\.$/, ''), port: 27017 }), 'connect', 2500,
  )));
  const tlsPromise = (version) => Promise.all(members.map((record) => socketResult(
    () => tls.connect({
      host: record.name.replace(/\.$/, ''),
      port: 27017,
      servername: record.name.replace(/\.$/, ''),
      rejectUnauthorized: true,
      minVersion: version,
      maxVersion: version,
    }), 'secureConnect', 2500, true,
  )));
  const [tcpResults, tls12, tls13] = await Promise.all([
    tcpPromise,
    tlsPromise('TLSv1.2'),
    tlsPromise('TLSv1.3'),
  ]);
  const tlsResults = { tls12, tls13 };

  return res.status(200).json({
    previewOnly: true,
    srv: { ok: true, count: records.length },
    memberDns: summarize(dnsResults),
    tcp27017: summarize(tcpResults),
    tls12Strict: summarize(tlsResults.tls12),
    tls13Strict: summarize(tlsResults.tls13),
  });
};
