import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_auth_session_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

const [{ default: app }, { default: mongoose }, { connectDatabase }, { default: User }] = await Promise.all([
  import("../src/app.js"),
  import("mongoose"),
  import("../src/config/database.js"),
  import("../src/models/User.js"),
]);

let server;
let baseURL;

async function request(path, { method = "GET", token, cookie, body } = {}) {
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
  const setCookie = response.headers.get("set-cookie") || "";
  const refreshCookie = setCookie.split(/,\s*/).find((part) => part.startsWith("refreshToken="))?.split(";")[0];
  return { status: response.status, body: json, refreshCookie };
}

before(async () => {
  await connectDatabase();
  await User.create({
    name: "Disposable Auth Test Admin",
    email: "auth-session-test@portfolio.invalid",
    password: "DisposableStrongPassword123!",
    role: "admin",
  });
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test("MongoDB allows one refresh rotation and account logout revokes access sessions", async () => {
  const login = await request("/auth/login", {
    method: "POST",
    body: { email: "auth-session-test@portfolio.invalid", password: "DisposableStrongPassword123!" },
  });
  assert.equal(login.status, 200);
  const initialAccessToken = login.body.data.accessToken;

  const refreshes = await Promise.all([
    request("/auth/refresh", { method: "POST", cookie: login.refreshCookie }),
    request("/auth/refresh", { method: "POST", cookie: login.refreshCookie }),
  ]);
  assert.deepEqual(refreshes.map(({ status }) => status).sort(), [200, 401]);
  const successfulRefresh = refreshes.find(({ status }) => status === 200);
  assert.equal((await request("/auth/me", { token: successfulRefresh.body.data.accessToken })).status, 200);

  const logout = await request("/auth/logout", { method: "POST", cookie: successfulRefresh.refreshCookie });
  assert.equal(logout.status, 200);
  assert.equal((await request("/auth/me", { token: initialAccessToken })).status, 401);
  assert.equal((await request("/auth/me", { token: successfulRefresh.body.data.accessToken })).status, 401);
  assert.equal((await request("/auth/refresh", { method: "POST", cookie: successfulRefresh.refreshCookie })).status, 401);
});
