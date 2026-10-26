import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import { ADMIN_INIT_ENV, initializeAdminOnce, isAdminInitializationEnabled } from "../src/utils/adminInitialization.js";

const testPassword = crypto.randomBytes(32).toString("base64url");
const productionRuntime = {
  NODE_ENV: "production",
  RENDER: "true",
  IS_PULL_REQUEST: "false",
  RENDER_SERVICE_ID: "srv-dbehs71srm7s73c6pkk0",
  RENDER_SERVICE_NAME: "portfolio-api-production",
  [ADMIN_INIT_ENV.enabled]: "true",
  [ADMIN_INIT_ENV.secret]: crypto.randomBytes(32).toString("base64url"),
  [ADMIN_INIT_ENV.email]: "portfolio.admin@example.com",
  [ADMIN_INIT_ENV.password]: testPassword,
};

function setup({ databaseName = "portfolio_production", users = [], marker = null } = {}) {
  const calls = { connect: 0, markerRead: 0, markerWrite: 0, countAdmins: 0, findUser: 0, createUser: 0 };
  const collection = {
    async findOne() { calls.markerRead += 1; return marker; },
    async insertOne() { calls.markerWrite += 1; marker = { _id: "production-admin-initialization-v1" }; },
  };
  const mongoose = { connection: { db: {
    databaseName,
    collection() { return collection; },
  } } };
  const User = {
    async countDocuments({ role }) { calls.countAdmins += 1; return users.filter((user) => user.role === role).length; },
    async findOne({ email }) { calls.findUser += 1; return users.find((user) => user.email === email) || null; },
    async create(user) { calls.createUser += 1; users.push({ ...user }); return user; },
  };
  const dependencies = {
    runtime: productionRuntime,
    suppliedSecret: productionRuntime[ADMIN_INIT_ENV.secret],
    async connectDatabase() { calls.connect += 1; },
    mongoose,
    User,
  };
  return { calls, dependencies, users };
}

test("initialization is disabled unless explicitly enabled", () => {
  assert.equal(isAdminInitializationEnabled({}), false);
  assert.equal(isAdminInitializationEnabled({ [ADMIN_INIT_ENV.enabled]: "false" }), false);
  assert.equal(isAdminInitializationEnabled(productionRuntime), true);
});

test("wrong service identity is rejected before connecting or querying", async () => {
  const { calls, dependencies } = setup();
  dependencies.runtime = { ...productionRuntime, RENDER_SERVICE_ID: "other" };
  await assert.rejects(initializeAdminOnce(dependencies), { statusCode: 404 });
  assert.deepEqual(calls, { connect: 0, markerRead: 0, markerWrite: 0, countAdmins: 0, findUser: 0, createUser: 0 });
});

test("missing or incorrect one-time secret is rejected before connecting", async () => {
  const { calls, dependencies } = setup();
  dependencies.suppliedSecret = "wrong";
  await assert.rejects(initializeAdminOnce(dependencies), { statusCode: 401 });
  assert.deepEqual(calls, { connect: 0, markerRead: 0, markerWrite: 0, countAdmins: 0, findUser: 0, createUser: 0 });
});

test("actual connected database name is checked before any user query or write", async () => {
  const { calls, dependencies } = setup({ databaseName: "portfolio_recovery_test" });
  await assert.rejects(initializeAdminOnce(dependencies), { statusCode: 503 });
  assert.deepEqual(calls, { connect: 1, markerRead: 0, markerWrite: 0, countAdmins: 0, findUser: 0, createUser: 0 });
});

test("existing admin accounts are preserved and a new dedicated account is created", async () => {
  const old = { email: "legacy@example.com", password: "existing-hash", role: "admin" };
  const { calls, dependencies, users } = setup({ users: [old] });
  const result = await initializeAdminOnce(dependencies);
  assert.deepEqual(result, { created: true, existingAdminFound: true });
  assert.deepEqual(users[0], old);
  assert.equal(users.length, 2);
  assert.equal(users[1].email, productionRuntime[ADMIN_INIT_ENV.email]);
  assert.equal(users[1].role, "admin");
  assert.equal(users[1].password, testPassword);
  assert.equal(calls.createUser, 1);
  assert.equal(calls.markerWrite, 1);
});

test("a repeat initialization is refused after the one-time marker is written", async () => {
  const { calls, dependencies, users } = setup();
  assert.equal((await initializeAdminOnce(dependencies)).created, true);
  const afterFirstRun = users.map((user) => ({ ...user }));
  await assert.rejects(initializeAdminOnce(dependencies), { statusCode: 409 });
  assert.deepEqual(users, afterFirstRun);
  assert.equal(calls.createUser, 1);
  assert.equal(calls.markerWrite, 1);
});

test("an existing target account is not modified", async () => {
  const old = { email: productionRuntime[ADMIN_INIT_ENV.email], password: "existing-hash", role: "editor" };
  const { calls, dependencies, users } = setup({ users: [old] });
  const result = await initializeAdminOnce(dependencies);
  assert.deepEqual(result, { created: false, existingAdminFound: false });
  assert.deepEqual(users, [old]);
  assert.equal(calls.createUser, 0);
  assert.equal(calls.markerWrite, 1);
});
