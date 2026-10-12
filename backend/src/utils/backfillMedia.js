import fs from "fs/promises";
import path from "path";
import { connectDatabase } from "../config/database.js";
import mongoose from "mongoose";
import Media from "../models/Media.js";
import { env } from "../config/env.js";
import { getLocalStorageDirectory } from "./storage.js";

const EXTENSION_MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

const DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);

/**
 * Backfills the Media collection from whatever is already sitting in
 * uploads/. This can't recover information multer never kept (the original
 * filename the uploader chose, who uploaded it) â€” those legacy files get a
 * best-effort record instead so they at least become visible/searchable
 * and deletable through the Media Library, without touching the files.
 *
 * The reconstructed absolute URL must exactly match what Project/Certification/
 * Profile/BlogPost documents already have stored (built at upload time from
 * the request's own protocol+host), or the "which resources use this file"
 * matching in the Media Library won't recognize legacy files. Set
 * PUBLIC_API_URL in .env to your backend's real public origin
 * (e.g. http://localhost:5000 or https://api.example.com) before running
 * this if it differs from the default below.
 *
 * Safe to re-run: skips any file that already has a Media record.
 *
 * Usage: npm run backfill-media
 */
async function backfillMedia() {
  await connectDatabase();
  console.log(`[backfill-media] Connected to database: ${mongoose.connection.name} (${mongoose.connection.host})`);

  const publicBaseUrl = (process.env.PUBLIC_API_URL || `http://localhost:${env.PORT}`).replace(/\/+$/, "");
  console.log(`[backfill-media] Reconstructing URLs as: ${publicBaseUrl}/uploads/<filename>`);
  console.log(
    `[backfill-media] If your uploaded files were served from a different host, re-run with ` +
      `PUBLIC_API_URL=https://your-real-host npm run backfill-media instead.`
  );

  const uploadsDir = getLocalStorageDirectory();
  let filenames;
  try {
    filenames = await fs.readdir(uploadsDir);
  } catch (err) {
    console.error(`[backfill-media] Could not read uploads directory at ${uploadsDir}:`, err.message);
    process.exit(1);
  }

  const existing = new Set((await Media.find().select("filename")).map((m) => m.filename));

  let created = 0;
  let skippedExisting = 0;
  let skippedUnsupported = 0;

  for (const filename of filenames) {
    if (existing.has(filename)) {
      skippedExisting++;
      continue;
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeType = EXTENSION_MIME_MAP[ext];
    if (!mimeType) {
      skippedUnsupported++;
      continue; // not a file type this app ever uploads â€” leave it alone, don't guess
    }

    const filePath = path.join(uploadsDir, filename);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) continue;

    await Media.create({
      filename,
      // The original filename the uploader chose was never stored for
      // pre-Phase-7 uploads â€” the stored filename is the best available label.
      originalName: filename,
      url: `${publicBaseUrl}/uploads/${filename}`,
      mimeType,
      size: stat.size,
      category: DOCUMENT_MIME_TYPES.has(mimeType) ? "document" : "image",
      usedIn: "other",
      createdAt: stat.birthtime || stat.mtime,
    });
    created++;
  }

  console.log(`[backfill-media] Done. Created: ${created}, already tracked: ${skippedExisting}, skipped (unsupported type): ${skippedUnsupported}`);
  await mongoose.disconnect();
  process.exit(0);
}

backfillMedia().catch((err) => {
  console.error("[backfill-media] Failed:", err);
  process.exit(1);
});

