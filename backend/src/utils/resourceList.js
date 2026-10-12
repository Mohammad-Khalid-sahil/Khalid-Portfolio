/**
 * Applies allowlisted search/sort and optional bounded pagination to existing
 * resource list routes. Requests without page/limit retain the legacy full-list
 * response for existing public consumers.
 */
export async function getResourceList(Model, req, {
  searchFields = [],
  sortFields = {},
  defaultSort = { createdAt: -1 },
  filter = {},
  populate = null,
  select = null,
} = {}) {
  const queryFilter = { ...filter };
  const search = String(req.query.search || "").trim();
  if (search && searchFields.length) {
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    queryFilter.$or = searchFields.map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
  }

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 25;
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const paginated = req.query.page !== undefined || req.query.limit !== undefined;
  const sort = req.query.sort && sortFields[req.query.sort] ? sortFields[req.query.sort] : defaultSort;

  let query = Model.find(queryFilter).sort(sort);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (paginated) query = query.skip((page - 1) * limit).limit(limit);

  const [docs, total] = await Promise.all([query, Model.countDocuments(queryFilter)]);
  const meta = paginated
    ? { count: total, total, page, limit, pages: Math.ceil(total / limit) }
    : { count: total };
  return { docs, meta };
}

export function resourceSortFields(field, defaultSort, chronologicalField = "createdAt") {
  return {
    default: defaultSort,
    newest: { [chronologicalField]: -1 },
    oldest: { [chronologicalField]: 1 },
    alpha: { [field]: 1 },
    alphaDesc: { [field]: -1 },
    order: { order: 1, createdAt: -1 },
  };
}


