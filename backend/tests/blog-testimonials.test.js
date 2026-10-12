import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_phase2_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

const [
  { default: app },
  { default: mongoose },
  { connectDatabase },
  { default: User },
  { default: BlogPost },
  { default: Category },
  { default: Tag },
  { default: Testimonial },
] = await Promise.all([
  import("../src/app.js"),
  import("mongoose"),
  import("../src/config/database.js"),
  import("../src/models/User.js"),
  import("../src/models/BlogPost.js"),
  import("../src/models/Category.js"),
  import("../src/models/Tag.js"),
  import("../src/models/Testimonial.js"),
]);

let server;
let baseURL;
let adminToken;

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

  return { status: response.status, body: json };
}

async function createAdminSession() {
  await User.create({
    name: "Admin User",
    email: "phase2-admin@portfolio.dev",
    password: "ChangeMe123!",
    role: "admin",
  });

  const login = await request("/auth/login", {
    method: "POST",
    body: { email: "phase2-admin@portfolio.dev", password: "ChangeMe123!" },
  });

  adminToken = login.body.data.accessToken;
}

before(async () => {
  await connectDatabase();
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    BlogPost.deleteMany({}),
    Category.deleteMany({}),
    Tag.deleteMany({}),
    Testimonial.deleteMany({}),
  ]);
  adminToken = null;
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test("public blog shows published posts and hides drafts", async () => {
  await BlogPost.create([
    { title: "Published Post", slug: "published-post", content: "Visible content", published: true, publishedAt: new Date() },
    { title: "Draft Post", slug: "draft-post", content: "Hidden content", published: false },
  ]);

  const list = await request("/blog");
  const draftDetail = await request("/blog/draft-post");

  assert.equal(list.status, 200);
  assert.deepEqual(
    list.body.data.map((post) => post.slug),
    ["published-post"]
  );
  assert.equal(draftDetail.status, 404);
});

test("admin blog can list drafts and published posts with filters", async () => {
  await createAdminSession();
  const category = await Category.create({ name: "Engineering", slug: "engineering" });
  const tag = await Tag.create({ name: "Node", slug: "node" });

  await BlogPost.create([
    {
      title: "Published Post",
      slug: "published-post",
      content: "Visible content",
      category: category._id,
      tags: [tag._id],
      published: true,
      publishedAt: new Date(),
    },
    { title: "Draft Post", slug: "draft-post", content: "Hidden content", published: false },
  ]);

  const all = await request("/blog/admin/all", { token: adminToken });
  const drafts = await request("/blog/admin/all?status=draft", { token: adminToken });
  const byCategory = await request(`/blog/admin/all?category=${category._id}`, { token: adminToken });
  const byTag = await request(`/blog/admin/all?tag=${tag._id}`, { token: adminToken });
  const bySearch = await request("/blog/admin/all?search=Published", { token: adminToken });

  assert.equal(all.status, 200);
  assert.equal(all.body.data.length, 2);
  assert.deepEqual(drafts.body.data.map((post) => post.slug), ["draft-post"]);
  assert.deepEqual(byCategory.body.data.map((post) => post.slug), ["published-post"]);
  assert.deepEqual(byTag.body.data.map((post) => post.slug), ["published-post"]);
  assert.deepEqual(bySearch.body.data.map((post) => post.slug), ["published-post"]);
});

test("admin blog can create draft, edit, publish, unpublish, and delete", async () => {
  await createAdminSession();

  const created = await request("/blog", {
    method: "POST",
    token: adminToken,
    body: {
      title: "Lifecycle Post",
      slug: "lifecycle-post",
      cover: "https://example.com/cover.jpg",
      content: "Draft content",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      seoKeywords: ["node", "portfolio"],
      published: false,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.data.published, false);
  assert.ok(created.body.data.author);
  assert.equal(created.body.data.seoTitle, "SEO title");

  const updated = await request(`/blog/${created.body.data._id}`, {
    method: "PUT",
    token: adminToken,
    body: { title: "Lifecycle Post Edited", content: "Updated content", published: true },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.title, "Lifecycle Post Edited");
  assert.equal(updated.body.data.published, true);
  assert.ok(updated.body.data.publishedAt);

  const publicDetail = await request("/blog/lifecycle-post");
  assert.equal(publicDetail.status, 200);

  const unpublished = await request(`/blog/${created.body.data._id}`, {
    method: "PUT",
    token: adminToken,
    body: { published: false },
  });
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.body.data.published, false);
  assert.equal(unpublished.body.data.publishedAt, null);

  const hiddenAgain = await request("/blog/lifecycle-post");
  assert.equal(hiddenAgain.status, 404);

  const deleted = await request(`/blog/${created.body.data._id}`, { method: "DELETE", token: adminToken });
  const adminList = await request("/blog/admin/all", { token: adminToken });
  assert.equal(deleted.status, 200);
  assert.equal(adminList.body.data.length, 0);
});

test("public testimonials show approved entries and hide unapproved entries", async () => {
  const approved = await Testimonial.create({ name: "Approved Client", message: "Visible", approved: true });
  const unapproved = await Testimonial.create({ name: "Pending Client", message: "Hidden", approved: false });

  const list = await request("/testimonials");
  const approvedDetail = await request(`/testimonials/${approved._id}`);
  const unapprovedDetail = await request(`/testimonials/${unapproved._id}`);

  assert.equal(list.status, 200);
  assert.deepEqual(
    list.body.data.map((testimonial) => testimonial.name),
    ["Approved Client"]
  );
  assert.equal(approvedDetail.status, 200);
  assert.equal(unapprovedDetail.status, 404);
});

test("admin testimonials can list all and moderate visibility", async () => {
  await createAdminSession();
  await Testimonial.create({ name: "Approved Client", message: "Visible", approved: true });
  const pending = await Testimonial.create({ name: "Pending Client", message: "Hidden", approved: false });

  const all = await request("/testimonials/admin/all", { token: adminToken });
  const pendingOnly = await request("/testimonials/admin/all?status=pending", { token: adminToken });
  assert.equal(all.status, 200);
  assert.equal(all.body.data.length, 2);
  assert.deepEqual(pendingOnly.body.data.map((testimonial) => testimonial.name), ["Pending Client"]);

  const approved = await request(`/testimonials/${pending._id}`, {
    method: "PUT",
    token: adminToken,
    body: { approved: true, message: "Approved now" },
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.approved, true);

  const publicAfterApprove = await request("/testimonials");
  assert.equal(publicAfterApprove.body.data.some((testimonial) => testimonial.name === "Pending Client"), true);

  const rejected = await request(`/testimonials/${pending._id}`, {
    method: "PUT",
    token: adminToken,
    body: { approved: false },
  });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.approved, false);

  const deleted = await request(`/testimonials/${pending._id}`, { method: "DELETE", token: adminToken });
  assert.equal(deleted.status, 200);
});

test("public testimonial submissions are created as pending", async () => {
  const submitted = await request("/testimonials", {
    method: "POST",
    body: { name: "Submitted Client", message: "Please review", rating: 5 },
  });
  const publicList = await request("/testimonials");

  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.data.approved, false);
  assert.equal(publicList.body.data.length, 0);
});
