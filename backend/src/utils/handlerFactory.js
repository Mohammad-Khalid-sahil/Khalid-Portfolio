import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/sendSuccess.js";

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelField(Model) {
  return ["name", "title", "position", "degree", "company", "organization"].find((field) => Model.schema.path(field)) || "_id";
}

export async function queryResourceList(Model, req, { filter = {}, defaultSort = "order -createdAt", populate = null } = {}) {
  const query = req.query;
  const safeFilter = { ...filter };
  const search = String(query.search || "").trim();
  if (search) {
    const fields = Object.entries(Model.schema.paths)
      .filter(([, schemaPath]) => schemaPath.instance === "String")
      .map(([field]) => field);
    if (fields.length) safeFilter.$or = fields.map((field) => ({ [field]: { $regex: escapeRegex(search), $options: "i" } }));
  }

  const sort = {
    default: defaultSort,
    order: defaultSort,
    newest: "-createdAt",
    oldest: "createdAt",
    alpha: labelField(Model),
    alphaDesc: `-${labelField(Model)}`,
  }[query.sort] || defaultSort;
  const paginated = query.page !== undefined || query.limit !== undefined;
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 100);
  const skip = paginated ? (page - 1) * limit : 0;

  let docsQuery = Model.find(safeFilter).sort(sort);
  if (populate) docsQuery = docsQuery.populate(populate);
  if (paginated) docsQuery = docsQuery.skip(skip).limit(limit);
  const [docs, total] = await Promise.all([docsQuery, Model.countDocuments(safeFilter)]);
  const meta = paginated ? { total, page, limit, pages: Math.ceil(total / limit) } : { count: total };
  return { docs, meta };
}

export function getAll(Model, { defaultSort = "order -createdAt", populate = null } = {}) {
  return catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured) filter.featured = req.query.featured === "true";
    const { docs, meta } = await queryResourceList(Model, req, { filter, defaultSort, populate });
    sendSuccess(res, { message: `${Model.modelName} list retrieved`, data: docs, meta });
  });
}

export function getOne(Model, { populate = null } = {}) {
  return catchAsync(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);

    const doc = await query;
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    sendSuccess(res, { message: `${Model.modelName} retrieved`, data: doc });
  });
}

export function createOne(Model) {
  return catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    sendSuccess(res, { statusCode: 201, message: `${Model.modelName} created`, data: doc });
  });
}

export function updateOne(Model) {
  return catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    sendSuccess(res, { message: `${Model.modelName} updated`, data: doc });
  });
}

export function deleteOne(Model) {
  return catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    sendSuccess(res, { message: `${Model.modelName} deleted` });
  });
}
