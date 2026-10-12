import crypto from "node:crypto";
import { env } from "../config/env.js";

const INCREMENT_SCRIPT = "local hits = redis.call('INCR', KEYS[1]); local ttl = redis.call('PTTL', KEYS[1]); if ttl < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); ttl = ARGV[1]; end; return {hits, ttl}";
const DECREMENT_SCRIPT = "local hits = redis.call('DECR', KEYS[1]); if hits < 1 then redis.call('DEL', KEYS[1]); return 0; end; return hits";

export class UpstashRateLimitStore {
  constructor(namespace, { url = env.UPSTASH_REDIS_REST_URL, token = env.UPSTASH_REDIS_REST_TOKEN, fetchImpl = fetch } = {}) {
    if (!namespace || !url || !token) throw new Error("Shared rate-limit storage is not configured.");
    this.namespace = namespace;
    this.url = url.replace(/\/+$/, "");
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.windowMs = 60_000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  redisKey(key) {
    const digest = crypto.createHmac("sha256", env.JWT_SECRET).update(String(key)).digest("hex");
    return `portfolio:ratelimit:${this.namespace}:${digest}`;
  }

  async command(command) {
    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("Shared rate-limit service request failed.");
    const payload = await response.json();
    if (payload.error) throw new Error("Shared rate-limit service command failed.");
    return payload.result;
  }

  async increment(key) {
    const [totalHits, ttl] = await this.command(["EVAL", INCREMENT_SCRIPT, "1", this.redisKey(key), String(this.windowMs)]);
    return { totalHits: Number(totalHits), resetTime: new Date(Date.now() + Math.max(0, Number(ttl))) };
  }

  async decrement(key) {
    await this.command(["EVAL", DECREMENT_SCRIPT, "1", this.redisKey(key)]);
  }

  async resetKey(key) {
    await this.command(["DEL", this.redisKey(key)]);
  }
}
