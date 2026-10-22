import mongoose from "mongoose";
import { env, isProd } from "./env.js";

let connectionPromise;

const SAFE_DIAGNOSTIC_TOKEN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function safeToken(value) {
  return typeof value === "string" && SAFE_DIAGNOSTIC_TOKEN.test(value) ? value : undefined;
}

function safeCode(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const knownCodes = new Set([
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ECONNRESET",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ECONNABORTED",
    "ERR_TLS_CERT_ALTNAME_INVALID",
  ]);
  return typeof value === "string" && knownCodes.has(value) ? value : undefined;
}

function safeErrorName(value) {
  const name = safeToken(value);
  if (!name) return undefined;
  if (["Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "AggregateError"].includes(name)) return name;
  return /^(Mongo|Mongoose)[A-Za-z0-9_]{1,61}$/.test(name) ? name : undefined;
}

function safeConnectionDetail(error) {
  const message = [error?.message, error?.cause?.message]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  if (/disconnected before secure tls connection was established/.test(message)) {
    return "socket_disconnected_before_tls";
  }
  if (/disconnected after secure tls connection was established/.test(message)) {
    return "socket_disconnected_after_tls";
  }
  if (/err_tls_cert_altname_invalid|certificate verify failed|unable to verify the first certificate|self.signed certificate|certificate has expired/.test(message)) {
    return "tls_certificate_validation_failed";
  }
  if (/tlsv\d.*alert|alert handshake failure|handshake failure/.test(message)) {
    return "tls_alert_or_handshake_rejected";
  }
  if (/tls handshake.*timed out|handshake timeout/.test(message)) {
    return "tls_handshake_timeout";
  }
  if (/tls|certificate|secure tls/.test(message)) return "tls_negotiation_failed";
  return undefined;
}

function safeServerErrorSummaries(error) {
  const servers = error?.reason?.servers;
  const descriptions = servers instanceof Map
    ? [...servers.values()]
    : servers && typeof servers === "object"
      ? Object.values(servers)
      : [];
  const summaries = [];

  for (const description of descriptions) {
    const serverError = description?.error || description?.cause;
    if (!serverError) continue;

    const summary = { classification: classifyConnectionError(serverError) };
    const detail = safeConnectionDetail(serverError);
    const name = safeErrorName(serverError?.name);
    const code = safeCode(serverError?.code);
    const causeCode = safeCode(serverError?.cause?.code);
    if (name) summary.name = name;
    if (detail) summary.detail = detail;
    if (code !== undefined) summary.code = code;
    if (causeCode !== undefined) summary.causeCode = causeCode;
    summaries.push(summary);
  }

  const unique = [...new Map(summaries.map((summary) => [JSON.stringify(summary), summary])).values()];
  return unique.slice(0, 5);
}

function classifyConnectionError(error) {
  const codes = [error?.code, error?.cause?.code].map((code) => String(code || "").toUpperCase());
  const labels = [error?.codeName, error?.cause?.codeName, error?.name, error?.cause?.name]
    .map((label) => String(label || "").toLowerCase());
  const message = [error?.message, error?.cause?.message].map((value) => String(value || "").toLowerCase()).join(" ");

  if (codes.includes("18") || labels.some((label) => label.includes("authenticationfailed")) || /authentication failed|bad auth/.test(message)) {
    return "authentication_failed";
  }
  if (codes.includes("13") || labels.some((label) => label.includes("unauthorized")) || /not authorized/.test(message)) {
    return "authorization_failed";
  }
  if (codes.some((code) => ["ENOTFOUND", "EAI_AGAIN"].includes(code)) || /querysrv|enotfound|eai_again|dns lookup|name resolution/.test(message)) {
    return "dns_resolution_failed";
  }
  if (codes.includes("ECONNREFUSED") || /econnrefused|connection refused/.test(message)) return "connection_refused";
  if (codes.includes("ETIMEDOUT") || /timed out|timeout/.test(message)) return "connection_timeout";
  if (codes.includes("ECONNRESET") || /econnreset|connection reset/.test(message)) return "connection_reset";
  if (/tls|certificate/.test(message)) return "tls_negotiation_failed";
  if (labels.some((label) => label.includes("servers election") || label.includes("serverselection"))) {
    return "server_selection_failed";
  }
  return "connection_failed";
}

function safeConnectionErrorSummary(error) {
  const summary = { classification: classifyConnectionError(error) };
  const name = safeErrorName(error?.name);
  const code = safeCode(error?.code);
  const causeCode = safeCode(error?.cause?.code);

  if (name) summary.name = name;
  if (code !== undefined) summary.code = code;
  if (causeCode !== undefined) summary.causeCode = causeCode;
  const serverErrors = safeServerErrorSummaries(error);
  if (serverErrors.length > 0) summary.serverErrors = serverErrors;

  return summary;
}

mongoose.connection.on("disconnected", () => {
  connectionPromise = undefined;
  // eslint-disable-next-line no-console
  console.warn("[database] Disconnected");
});

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  }).then(() => {
    // eslint-disable-next-line no-console
    if (isProd) console.log("[database] Connected.");
    else console.log(`[database] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose;
  }).catch((error) => {
    connectionPromise = undefined;
    // eslint-disable-next-line no-console
    console.error(`[database] Connection failed. ${JSON.stringify(safeConnectionErrorSummary(error))}`);
    throw error;
  });

  return connectionPromise;
}
