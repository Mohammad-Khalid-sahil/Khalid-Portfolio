import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_projects_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";

const [
  { default: app },
  { default: mongoose },
  { connectDatabase },
  { default: User },
  { default: Project },
] = await Promise.all([
  import("../src/app.js"),
  import("mongoose"),
  import("../src/config/database.js"),
  import("../src/models/User.js"),
  import("../src/models/Project.js"),
]);

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
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await connectDatabase();
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Project.deleteMany({})]);
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test("project create, gallery persistence, public detail, edit, search, and delete", async () => {
  await User.create({
    name: "Projects Test Admin",
    email: "projects-test-admin@portfolio.dev",
    password: "ChangeMe123!",
    role: "admin",
  });
  const login = await request("/auth/login", {
    method: "POST",
    body: { email: "projects-test-admin@portfolio.dev", password: "ChangeMe123!" },
  });
  assert.equal(login.status, 200);
  const token = login.body.data.accessToken;

  const gallery = [
    "http://localhost:5000/uploads/project-shot-one.png",
    "https://images.example.test/project-shot-two.png",
  ];
  const created = await request("/projects", {
    method: "POST",
    token,
    body: {
      title: "Portfolio Project Flow Check",
      translations: { fa: { title: "پروژه نمونه" }, ps: { title: "د پروژې بېلګه" } },
      slug: "portfolio-project-flow-check",
      description: "Temporary project flow regression fixture.",
      thumbnail: "https://images.example.test/project-thumbnail.png",
      gallery,
      category: "web",
      technologies: ["React", "MongoDB"],
      published: true,
    },
  });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.gallery, gallery);

  const persisted = await Project.findById(created.body.data._id).lean();
  assert.deepEqual(persisted.gallery, gallery);
  assert.equal(persisted.thumbnail, "https://images.example.test/project-thumbnail.png");

  const publicList = await request("/projects");
  assert.equal(publicList.status, 200);
  assert.equal(publicList.body.data.length, 1);
  assert.deepEqual(publicList.body.data[0].gallery, gallery);
assert.equal((await request("/projects?locale=fa")).body.data[0].title, "پروژه نمونه");
  assert.equal((await request("/projects?locale=ps")).body.data[0].title, "د پروژې بېلګه");
  const dariDetail = await request("/projects/portfolio-project-flow-check?locale=fa");
  assert.equal(dariDetail.body.data.title, "پروژه نمونه");
  assert.equal(dariDetail.body.data.description, "Temporary project flow regression fixture.");
  assert.equal(Object.hasOwn(dariDetail.body.data, "translations"), false);

  const detail = await request("/projects/portfolio-project-flow-check");
  assert.equal(detail.status, 200);
  assert.deepEqual(detail.body.data.gallery, gallery);

  const noMatch = await request("/projects?search=no-such-project");
  assert.equal(noMatch.status, 200);
  assert.equal(noMatch.body.data.length, 0);
  const match = await request("/projects?search=Flow%20Check");
  assert.equal(match.status, 200);
  assert.equal(match.body.data.length, 1);

  const updatedGallery = [gallery[1]];
  const updated = await request(`/projects/${created.body.data._id}`, {
    method: "PUT",
    token,
    body: { title: "Updated Portfolio Project Flow Check", gallery: updatedGallery },
  });
  assert.equal(updated.status, 200);
  assert.deepEqual(updated.body.data.gallery, updatedGallery);
  assert.deepEqual((await Project.findById(created.body.data._id).lean()).gallery, updatedGallery);

  const deleted = await request(`/projects/${created.body.data._id}`, { method: "DELETE", token });
  assert.equal(deleted.status, 200);
  assert.equal(await Project.countDocuments({ _id: created.body.data._id }), 0);
});

