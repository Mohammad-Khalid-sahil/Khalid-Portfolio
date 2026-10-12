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
const Analytics = (await import("../src/models/Analytics.js")).default;
const { env } = await import("../src/config/env.js");

const userId = new mongoose.Types.ObjectId().toString();
const editorUserId = new mongoose.Types.ObjectId().toString();

const adminUser = {
  _id: userId,
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
  comparePassword: async () => true,
};

const editorUser = {
  _id: editorUserId,
  name: "Editor User",
  email: "editor@example.com",
  role: "editor",
  comparePassword: async () => true,
};

let server;
let baseURL;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

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

  return { response, status: response.status, body: json };
}

describe("API validation and admin access", () => {
  before(async () => {
    User.findById = async (id) => (id === userId ? adminUser : editorUser);
    server = app.listen(0);
    baseURL = `http://127.0.0.1:${server.address().port}/api`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("rejects invalid contact submissions before they reach the database", async () => {
    const result = await request("/contact", {
      method: "POST",
      body: {
        name: "",
        email: "not-an-email",
        subject: "",
        message: "too short",
      },
    });

    assert.equal(result.status, 400);
    assert.equal(result.body.message, "Validation failed");
    assert.ok(Array.isArray(result.body.details));
    assert.ok(result.body.details.some((entry) => entry.field === "name"));
    assert.ok(result.body.details.some((entry) => entry.field === "email"));
  });

  it("rejects malformed Mongo IDs before controller logic runs", async () => {
    const result = await request("/contact/messages/not-a-valid-id", { method: "DELETE", token: jwt.sign({ sub: userId, role: "admin" }, env.JWT_SECRET) });

    assert.equal(result.status, 400);
    assert.equal(result.body.message, "Validation failed");
    assert.ok(result.body.details.some((entry) => entry.field === "id"));
  });

  it("requires authentication and admin authorization for analytics summary", async () => {
    const unauthenticated = await request("/analytics/summary");
    const forbidden = await request("/analytics/summary", {
      token: jwt.sign({ sub: editorUserId, role: "editor" }, env.JWT_SECRET),
    });

    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.body.message, "Authentication required");
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.body.message, "You do not have permission to perform this action");
  });

  it("requires admin authorization for user management APIs", async () => {
    const unauthenticated = await request("/users");
    const forbidden = await request("/users", {
      token: jwt.sign({ sub: editorUserId, role: "editor" }, env.JWT_SECRET),
    });

    assert.equal(unauthenticated.status, 401);
    assert.equal(forbidden.status, 403);
  });

  it("uses the permission matrix to protect admin-only modules and destructive actions", async () => {
    const editorToken = jwt.sign({ sub: editorUserId, role: "editor" }, env.JWT_SECRET);
    const adminOnlyRequests = await Promise.all([
      request("/ai/status", { token: editorToken }),
      request("/settings", { method: "PUT", token: editorToken, body: {} }),
      request("/profile", { method: "PUT", token: editorToken, body: {} }),
      request("/contact/messages", { token: editorToken }),
      request(`/media/${new mongoose.Types.ObjectId()}`, { method: "DELETE", token: editorToken }),
      request(`/projects/${new mongoose.Types.ObjectId()}`, { method: "DELETE", token: editorToken }),
    ]);

    assert.deepEqual(adminOnlyRequests.map((result) => result.status), [403, 403, 403, 403, 403, 403]);
  });

  it("allows editors to enter content write routes while validating input before database writes", async () => {
    const editorToken = jwt.sign({ sub: editorUserId, role: "editor" }, env.JWT_SECRET);
    const [project, blog] = await Promise.all([
      request("/projects", { method: "POST", token: editorToken, body: {} }),
      request("/blog", { method: "POST", token: editorToken, body: {} }),
    ]);

    assert.equal(project.status, 400);
    assert.equal(project.body.message, "Validation failed");
    assert.equal(blog.status, 400);
    assert.equal(blog.body.message, "Validation failed");
  });

  it("returns sanitized user records to authorized admins", async () => {
    User.find = () => ({
      sort() {
        return {
          lean: async () => [
            {
              _id: userId,
              name: "Admin User",
              email: "admin@example.com",
              role: "admin",
              avatar: null,
              lastLoginAt: null,
              createdAt: new Date("2024-01-01"),
              updatedAt: new Date("2024-01-02"),
            },
          ],
        };
      },
    });

    const result = await request("/users", {
      token: jwt.sign({ sub: userId, role: "admin" }, env.JWT_SECRET),
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.data.length, 1);
    assert.equal(result.body.data[0].email, "admin@example.com");
    assert.equal(result.body.data[0].password, undefined);
    assert.equal(result.body.data[0].refreshTokenHash, undefined);
  });

  it("returns analytics summary to authorized admins", async () => {
    Analytics.countDocuments = async () => 42;
    Analytics.distinct = async () => ["a", "b", "c"];
    Analytics.aggregate = async (pipeline) => {
      if (pipeline[0]?.$match?.eventType === "page_view") return [{ _id: "/", views: 12 }];
      if (pipeline[0]?.$group?._id === "device") return [{ _id: "desktop", count: 7 }];
      if (pipeline[0]?.$group?._id === "browser") return [{ _id: "Chrome", count: 9 }];
      if (pipeline[0]?.$group?._id === "source") return [{ _id: "google", count: 5 }];
      if (pipeline[0]?.$match?.country) return [{ _id: "US", count: 3 }];
      return [{ _id: { contentType: "project" }, title: "Example", views: 8 }];
    };

    const result = await request("/analytics/summary", {
      token: jwt.sign({ sub: userId, role: "admin" }, env.JWT_SECRET),
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.data.totalViews, 42);
    assert.equal(result.body.data.visitors, 3);
    assert.equal(result.body.data.topPages[0]._id, "/");
  });
});
