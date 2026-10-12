import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = `mongodb://127.0.0.1:27017/portfolio_admin_resource_lists_test_${process.pid}_${Date.now()}`;
process.env.JWT_SECRET = "test_access_secret_that_is_long_enough_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_that_is_long_enough_12345";
process.env.JWT_EXPIRES_IN = "15m";

const [
  { default: app }, { default: mongoose }, { connectDatabase }, { default: User },
  { default: Project }, { default: Skill }, { default: Service }, { default: Experience },
  { default: Education }, { default: Certification }, { default: Testimonial },
  { default: Category }, { default: Tag },
] = await Promise.all([
  import("../src/app.js"), import("mongoose"), import("../src/config/database.js"), import("../src/models/User.js"),
  import("../src/models/Project.js"), import("../src/models/Skill.js"), import("../src/models/Service.js"), import("../src/models/Experience.js"),
  import("../src/models/Education.js"), import("../src/models/Certification.js"), import("../src/models/Testimonial.js"),
  import("../src/models/Category.js"), import("../src/models/Tag.js"),
]);

let server;
let baseURL;
async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseURL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  await connectDatabase();
  server = app.listen(0);
  baseURL = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(async () => {
  await Promise.all([User, Project, Skill, Service, Experience, Education, Certification, Testimonial, Category, Tag].map((Model) => Model.deleteMany({})));
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test("all nine generic resources support searched, sorted, bounded page results", async () => {
  await User.create({ name: "List Admin", email: "list-admin@portfolio.dev", password: "ChangeMe123!", role: "admin" });
  const login = await request("/auth/login", { method: "POST", body: { email: "list-admin@portfolio.dev", password: "ChangeMe123!" } });
  const token = login.body.data.accessToken;

  const entries = [
    [Project, [{ title: "Needle Alpha", slug: "needle-alpha", description: "Needle project", category: "web" }, { title: "Needle Zulu", slug: "needle-zulu", description: "Needle project", category: "web" }]],
    [Skill, [{ name: "Needle Alpha", category: "frontend" }, { name: "Needle Zulu", category: "frontend" }]],
    [Service, [{ title: "Needle Alpha", description: "Needle service" }, { title: "Needle Zulu", description: "Needle service" }]],
    [Experience, [{ position: "Needle Alpha", company: "Company", startDate: "2020-01-01" }, { position: "Needle Zulu", company: "Company", startDate: "2021-01-01" }]],
    [Education, [{ degree: "Needle Alpha", university: "University", startDate: "2020-01-01" }, { degree: "Needle Zulu", university: "University", startDate: "2021-01-01" }]],
    [Certification, [{ name: "Needle Alpha", organization: "Issuer", date: "2020-01-01" }, { name: "Needle Zulu", organization: "Issuer", date: "2021-01-01" }]],
    [Testimonial, [{ name: "Needle Alpha", message: "Needle message" }, { name: "Needle Zulu", message: "Needle message" }]],
    [Category, [{ name: "Needle Alpha", slug: "needle-alpha" }, { name: "Needle Zulu", slug: "needle-zulu" }]],
    [Tag, [{ name: "Needle Alpha", slug: "needle-alpha" }, { name: "Needle Zulu", slug: "needle-zulu" }]],
  ];
  for (const [Model, docs] of entries) await Model.create(docs);

  const resources = [
    ["/projects/admin/all", "title"], ["/skills", "name"], ["/services", "title"], ["/experiences", "position"],
    ["/education", "degree"], ["/certifications", "name"], ["/testimonials/admin/all", "name"], ["/categories", "name"], ["/tags", "name"],
  ];
  for (const [path, labelField] of resources) {
    const first = await request(`${path}?search=Needle&page=1&limit=1&sort=alpha`, { token });
    const second = await request(`${path}?search=Needle&page=2&limit=1&sort=alpha`, { token });
    assert.equal(first.status, 200, `${path} page 1`);
    assert.equal(second.status, 200, `${path} page 2`);
    assert.equal(first.body.meta.total, 2, `${path} total`);
    assert.equal(first.body.meta.pages, 2, `${path} pages`);
    assert.equal(first.body.data[0][labelField], "Needle Alpha", `${path} alphabetical sort`);
    assert.equal(second.body.data[0][labelField], "Needle Zulu", `${path} pagination`);
  }

  const crudCases = [
    ["/projects", { title: "CRUD Project", slug: "crud-project", description: "Description" }, { title: "Updated CRUD Project" }],
    ["/skills", { name: "CRUD Skill", category: "frontend" }, { name: "Updated CRUD Skill" }],
    ["/services", { title: "CRUD Service", description: "Description" }, { title: "Updated CRUD Service" }],
    ["/experiences", { position: "CRUD Position", company: "Company", startDate: "2020-01-01" }, { position: "Updated CRUD Position" }],
    ["/education", { degree: "CRUD Degree", university: "University", startDate: "2020-01-01" }, { degree: "Updated CRUD Degree" }],
    ["/certifications", { name: "CRUD Certificate", organization: "Issuer", date: "2020-01-01" }, { name: "Updated CRUD Certificate" }],
    ["/testimonials", { name: "CRUD Testimonial", message: "Message" }, { name: "Updated CRUD Testimonial" }],
    ["/categories", { name: "CRUD Category", slug: "crud-category" }, { name: "Updated CRUD Category" }],
    ["/tags", { name: "CRUD Tag", slug: "crud-tag" }, { name: "Updated CRUD Tag" }],
  ];
  for (const [path, payload, update] of crudCases) {
    assert.equal((await request(path, { method: "POST", body: {}, token })).status, 400, `${path} validation`);
    const created = await request(path, { method: "POST", body: payload, token });
    assert.equal(created.status, 201, `${path} create`);
    const id = created.body.data._id;
    assert.equal((await request(`${path}/${id}`, { method: "PUT", body: update, token })).status, 200, `${path} update`);
    assert.equal((await request(`${path}/${id}`, { method: "DELETE", token })).status, 200, `${path} delete`);
  }
  const invalid = await request("/services?page=0&limit=101", { token });
  assert.equal(invalid.status, 400);
  const legacy = await request("/skills", { token });
  assert.equal(legacy.body.data.length, 2);
});

