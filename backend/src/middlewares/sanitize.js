/**
 * Recursively strips keys that start with "$" or contain "." from an
 * object/array, in place. Mongo operator injection relies on keys like
 * "$gt", "$where", or dotted paths — stripping them neutralizes the attack
 * without touching legitimate data.
 */
function stripDangerousKeys(input) {
  if (Array.isArray(input)) {
    input.forEach(stripDangerousKeys);
    return input;
  }

  if (input && typeof input === "object") {
    for (const key of Object.keys(input)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete input[key];
        continue;
      }
      stripDangerousKeys(input[key]);
    }
  }

  return input;
}

/**
 * Sanitizes req.body, req.params, and req.query against NoSQL injection.
 *
 * Express 5 turns `req.query` into a getter-only property, which breaks
 * middleware (like express-mongo-sanitize) that tries `req.query = value`.
 * This mutates the existing query/body objects in place instead of
 * reassigning them, so it works safely on Express 5.
 */
export function sanitizeInput(req, res, next) {
  if (req.body) stripDangerousKeys(req.body);
  if (req.params) stripDangerousKeys(req.params);
  if (req.query) stripDangerousKeys(req.query);
  next();
}

/**
 * Minimal HTTP Parameter Pollution guard: if a query param arrives as an
 * array (e.g. ?category=a&category=b), keep only the last value. Runs
 * in place for the same Express-5 getter-only reason as above.
 */
export function preventParamPollution(req, res, next) {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
}
