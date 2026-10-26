import express from "express";
import { sanitizeInput } from "./sanitize.js";

/** Parse bounded admin content after route authentication and permission checks. */
export const adminContentJsonParser = [express.json({ limit: "2mb" }), sanitizeInput];
