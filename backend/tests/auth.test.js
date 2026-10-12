import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

const app = (await import("../src/app.js")).default;
const User = (await import("../src/models/User.js")).default;
const { env } = await import("../src/config/env.js");

const userId = new mongoose.Types.ObjectId().toString();

const user = {
  _id: userId,
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$12$QFz9Q8m0S2QJ2db7k740ReY5eD7wC2mXX9O7YZC0wJY2dV0j2yQmS",
  role: "admin",
  refreshTokenHash: null,
  sessionVersion: 0,
  lastLoginAt: null,
  comparePassword: async (candidate) => candidate === "StrongPassword123!",
  save: async function save() {
    return this;
  },
};

function withSelect(doc) {
  if (!doc) {
    return {
      select() {
        return null;
      },
    };
  }

  return Object.assign(doc, {
    select() {
      return this;
    },
  });
}

let server;
let baseURL;
let failNextSessionWrite = false;

function getCookie(response, name) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie
    .split(/,\s*/)
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(";")[0];
}

async function request(path, { method = "GET", body, token, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  if (cookie) headers.cookie = cookie;

  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { response, status: response.status, body: json, cookie: getCookie(response, "refreshToken") };
}

describe("auth API", () => {
  before(async () => {
    User.findOne = ({ email }) => withSelect(email === user.email ? user : null);
    User.findById = (id) => withSelect(id === userId ? user : null);
    User.findOneAndUpdate = async (filter, update) => {
      if (failNextSessionWrite) {
        failNextSessionWrite = false;
        const error = new Error("simulated database outage");
        error.name = "MongoServerError";
        throw error;
      }
      if (String(filter._id) !== userId) return null;
      if (filter.refreshTokenHash && filter.refreshTokenHash !== user.refreshTokenHash) return null;
      const acceptedVersions = filter.$or;
      if (acceptedVersions && !acceptedVersions.some((condition) =>
        condition.sessionVersion === user.sessionVersion ||
        (condition.sessionVersion?.$exists === false && user.sessionVersion === undefined)
      )) return null;
      if (filter.sessionVersion !== undefined && filter.sessionVersion !== user.sessionVersion) return null;
      if (update.$set?.refreshTokenHash !== undefined) user.refreshTokenHash = update.$set.refreshTokenHash;
      if (update.$set?.lastLoginAt !== undefined) user.lastLoginAt = update.$set.lastLoginAt;
      if (update.$inc?.sessionVersion) user.sessionVersion += update.$inc.sessionVersion;
      return withSelect(user);
    };

    server = app.listen(0);
    baseURL = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });

  it("logs in successfully and issues an access token and refresh cookie", async () => {
    const result = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "StrongPassword123!" },
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.user.email, "admin@example.com");
    assert.equal(result.body.data.user.role, "admin");
    assert.ok(result.body.data.accessToken);
    assert.ok(result.cookie?.startsWith("refreshToken="));
    assert.match(result.response.headers.get("set-cookie"), /HttpOnly/);
    assert.match(result.response.headers.get("set-cookie"), /SameSite=Strict/);
    assert.match(result.response.headers.get("set-cookie"), /Max-Age=604800/);
  });

  it("rejects invalid credentials with a 401 response", async () => {
    const badPassword = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "wrong-password" },
    });

    const missingUser = await request("/auth/login", {
      method: "POST",
      body: { email: "other@example.com", password: "StrongPassword123!" },
    });

    assert.equal(badPassword.status, 401);
    assert.equal(badPassword.body.message, "Invalid email or password");
    assert.equal(missingUser.status, 401);
    assert.equal(missingUser.body.message, "Invalid email or password");
  });

  it("validates required login fields before reaching the controller", async () => {
    const missingEmail = await request("/auth/login", {
      method: "POST",
      body: { password: "StrongPassword123!" },
    });

    const missingPassword = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com" },
    });

    assert.equal(missingEmail.status, 400);
    assert.equal(missingEmail.body.message, "Validation failed");
    assert.equal(missingPassword.status, 400);
    assert.equal(missingPassword.body.message, "Validation failed");
  });

  it("rejects malformed or expired bearer tokens for protected routes", async () => {
    const invalid = await request("/auth/me", { token: "not-a-valid-jwt" });
    const expired = await request("/auth/me", {
      token: jwt.sign({ sub: userId, role: "admin" }, env.JWT_SECRET, { expiresIn: "-1s" }),
    });

    assert.equal(invalid.status, 401);
    assert.equal(invalid.body.message, "Invalid authentication token");
    assert.equal(expired.status, 401);
    assert.equal(expired.body.message, "Authentication token expired");
  });

  it("rotates the refresh token and reissues a valid access token", async () => {
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "StrongPassword123!" },
    });

    const refreshed = await request("/auth/refresh", { method: "POST", cookie: login.cookie });

    assert.equal(refreshed.status, 200);
    assert.ok(refreshed.body.data.accessToken);
    assert.ok(refreshed.cookie?.startsWith("refreshToken="));
    assert.notEqual(refreshed.cookie, login.cookie);

    const me = await request("/auth/me", { token: refreshed.body.data.accessToken });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.email, "admin@example.com");
  });

  it("accepts only one use of a refresh token", async () => {
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "StrongPassword123!" },
    });
    const results = await Promise.all([
      request("/auth/refresh", { method: "POST", cookie: login.cookie }),
      request("/auth/refresh", { method: "POST", cookie: login.cookie }),
    ]);

    assert.deepEqual(results.map(({ status }) => status).sort(), [200, 401]);
    const accepted = results.find(({ status }) => status === 200);
    assert.equal((await request("/auth/me", { token: accepted.body.data.accessToken })).status, 200);
  });

  it("logs out and invalidates the stored refresh token", async () => {
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "StrongPassword123!" },
    });

    const logout = await request("/auth/logout", { method: "POST", cookie: login.cookie });
    const accessAfterLogout = await request("/auth/me", { token: login.body.data.accessToken });
    const refreshAfterLogout = await request("/auth/refresh", { method: "POST", cookie: login.cookie });

    assert.equal(logout.status, 200);
    assert.equal(logout.body.message, "Logged out successfully");
    assert.equal(refreshAfterLogout.status, 401);
    assert.equal(refreshAfterLogout.body.message, "Invalid refresh token");
    assert.equal(accessAfterLogout.status, 401);
    assert.equal(accessAfterLogout.body.message, "Authentication session has been revoked");
  });

  it("returns an error when the session revocation write fails", async () => {
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "StrongPassword123!" },
    });
    failNextSessionWrite = true;

    const logout = await request("/auth/logout", { method: "POST", cookie: login.cookie });
    assert.equal(logout.status, 500);
    assert.ok(logout.body.message);
  });
});
