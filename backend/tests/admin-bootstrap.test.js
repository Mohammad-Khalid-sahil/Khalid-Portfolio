import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertAdminBootstrapRuntime,
  isAdminBootstrapEnabled,
  runAdminBootstrap,
} from "../src/utils/adminBootstrap.js";

const productionRuntime = {
  NODE_ENV: "production",
  RENDER: "true",
  IS_PULL_REQUEST: "false",
  RENDER_SERVICE_ID: "srv-dbehs71srm7s73c6pkk0",
  RENDER_SERVICE_NAME: "portfolio-api-production",
};

function setup({ databaseName = "portfolio_production", users = [] } = {}) {
  const calls = { connect: 0, find: 0, create: 0, logs: [] };
  const mongoose = { connection: { name: databaseName } };
  const User = {
    async findOne({ email }) {
      calls.find += 1;
      return users.find((user) => user.email === email) || null;
    },
    async create(user) {
      calls.create += 1;
      const doc = { ...user };
      users.push(doc);
      return doc;
    },
  };
  const dependencies = {
    runtime: productionRuntime,
    async connectDatabase() { calls.connect += 1; },
    mongoose,
    User,
    getCredentials() { return { email: "admin@example.test", password: "test-password-secret" }; },
    logger: { info(message) { calls.logs.push(message); } },
  };
  return { calls, dependencies, users };
}

test("wrong runtime is rejected before connecting or querying users", async () => {
  const { calls, dependencies } = setup();
  dependencies.runtime = { ...productionRuntime, IS_PULL_REQUEST: "true" };
  await assert.rejects(runAdminBootstrap(dependencies), /restricted to the verified Render Production service/);
  assert.deepEqual(calls, { connect: 0, find: 0, create: 0, logs: [] });
});

test("wrong connected database is rejected before any user query or write", async () => {
  const { calls, dependencies } = setup({ databaseName: "portfolio_preview" });
  await assert.rejects(runAdminBootstrap(dependencies), /database safeguard rejected/);
  assert.deepEqual(calls, { connect: 1, find: 0, create: 0, logs: [] });
});

test("missing seed credentials fail before user queries or writes", async () => {
  const { calls, dependencies } = setup();
  dependencies.getCredentials = () => { throw new Error("SEED_ADMIN_PASSWORD=do-not-print"); };
  await assert.rejects(runAdminBootstrap(dependencies));
  assert.deepEqual(calls, { connect: 0, find: 0, create: 0, logs: [] });
});

test("existing admin is preserved without updating or replacing it", async () => {
  const existing = { email: "admin@example.test", password: "existing-hash", role: "editor" };
  const { calls, dependencies, users } = setup({ users: [existing] });
  assert.equal(await runAdminBootstrap(dependencies), "existing");
  assert.deepEqual(users, [existing]);
  assert.equal(calls.find, 1);
  assert.equal(calls.create, 0);
});

test("an absent admin is created once and a repeat preserves that account", async () => {
  const { calls, dependencies, users } = setup();
  assert.equal(await runAdminBootstrap(dependencies), "created");
  const created = { ...users[0] };
  assert.equal(await runAdminBootstrap(dependencies), "existing");
  assert.equal(users.length, 1);
  assert.deepEqual(users[0], created);
  assert.equal(calls.create, 1);
});

test("bootstrap log messages never contain credentials or account details", async () => {
  const { calls, dependencies } = setup();
  await runAdminBootstrap(dependencies);
  const output = calls.logs.join("\n");
  for (const secret of ["admin@example.test", "test-password-secret", "portfolio_production"]) {
    assert.equal(output.includes(secret), false);
  }
  assert.deepEqual(calls.logs, ["[admin-bootstrap] Initial admin created."]);
});

test("runtime validator rejects local and wrong-service execution", () => {
  assert.throws(() => assertAdminBootstrapRuntime({ ...productionRuntime, RENDER: undefined }));
  assert.throws(() => assertAdminBootstrapRuntime({ ...productionRuntime, RENDER_SERVICE_ID: "other" }));
});

test("startup bootstrap remains disabled unless explicitly enabled", () => {
  assert.equal(isAdminBootstrapEnabled({}), false);
  assert.equal(isAdminBootstrapEnabled({ SEED_ADMIN_ON_START: "false" }), false);
  assert.equal(isAdminBootstrapEnabled({ SEED_ADMIN_ON_START: "true" }), true);
});
