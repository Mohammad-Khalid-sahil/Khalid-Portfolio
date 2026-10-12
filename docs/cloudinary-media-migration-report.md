# Existing Uploads → Cloudinary Migration Report

**Status: PREPARATION ONLY — NO CLOUDINARY UPLOADS OR DATABASE CHANGES.** No credentials were read or used, no production or local database records were queried/modified, no files were moved/deleted, and no deployment occurred.

## Inventory and backup verification

- Source directory: `backend/uploads/` — **68 files**, **3,958,460 bytes**.
- The named backup directory exists: `C:\Users\M.Khalid Sahil\Downloads\portfolio-backups\portfolio-20261012-092538\backend\uploads`.
- Backup verification performed against this uploads directory: all **68 source relative paths** have a matching backup file with identical byte length and SHA-256; **0 missing, extra, or mismatched files** in the backup uploads folder. This verifies the upload-file copy, not the entire backup or a database restore; no restore test was performed.
- File types by extension and signature: **55 PNG**, **10 JPG/JPEG (`.jpg`)**, **3 JPEG (`.jpeg`)**. Signatures matched these types. Total size is about **3.78 MiB**.
- Exact duplicate analysis: **14 unique SHA-256 values**, **13 duplicate groups**, with **67 of 68 files** belonging to an identical-content group. Duplicate groups are labeled `D01`–`D13` in the manifest. Files have not been deduplicated. Migration should preserve one manifest row per source filename and use unique deterministic destination IDs unless you separately approve sharing duplicate objects.
- Decoder validation found **7 suspect files** (all same 12-byte JPEG content, group `D13`) that have a JPEG header but fail Windows image decoding. Do not upload them as valid media until manually reviewed. The 69-byte PNG decoded successfully in the local image decoder check; this does not constitute cross-browser validation.
- Per-file path, size, extension, detected type, SHA-256, backup match, duplicate group, Cloudinary mapping placeholders, and database-reference status are in `docs/cloudinary-media-migration-manifest.csv`. Destination fields are blank and all upload statuses remain unattempted. No private media contents are included in the report or manifest.

## Storage and references found in code

The app stores media URLs as ordinary strings, not foreign-key references. `Media` records include `filename`, `storageProvider`, `storageKey`, `originalName`, `url`, `mimeType`, `size`, `category`, and `usedIn`. Known reference fields include:

- `Project.thumbnail` and `Project.gallery[]`
- `Certification.image`
- `Profile.avatar` and `Profile.resumeUrl`
- `BlogPost.cover`
- `Settings.seo.ogImage`
- `User.avatar` and `Testimonial.avatar`
- Media catalog `Media.url`

`backend/src/utils/media.js` currently searches/clears several URL fields for admin media deletion, but it does **not** include `Testimonial.avatar`; this must be accounted for in any reference inventory/update. Translation/document fields and any arbitrary URL strings require a read-only database content scan; schema/source inspection alone cannot prove every record reference. Exact references per file are therefore marked **not queried** in the manifest. No database connection/production credential was used for this audit.

The local-upload URL builder produces `/uploads/<filename>` URLs using the request host. The frontend stores/consumes URL strings directly in multiple components; `resolveMediaUrl` rewrites localhost hosts for some project views but does not establish that every old URL is transformed. The backend currently serves `/uploads` with local `express.static()`, which will not serve these assets in Vercel's Express runtime. Existing files and old URL values remain unchanged.

## Proposed reversible process (not run)

1. **Preflight and approval:** obtain explicit approval for a production read-only database export/scan and a Cloudinary migration window. Verify the backup and database snapshot independently immediately before execution. Resolve the seven invalid JPEGs and inspect every unreferenced/duplicate entry. Confirm provider, folder, resource type, account limits, and existing Cloudinary IDs; never expose API secrets to the browser or logs.
2. **Build the reference inventory:** export all exact old URL/path values per collection/document ID and field, including the fields above, `Testimonial.avatar`, translation values, and any `Media.url`. Save a protected database snapshot and a journal of old values before changing anything. Use IDs or a secure private report; do not publish personal labels/content.
3. **Copy, never overwrite:** upload to a dedicated, approved Cloudinary folder with a deterministic ID derived from the source relative path plus SHA-256. For retries, inspect an existing ID and verify it matches the expected source hash; refuse overwrite on any mismatch. Keep separate IDs for same-content filenames by default so one old path cannot unintentionally alias another. Do not delete/replace original files.
4. **Validate each object:** compare provider metadata to expected type/size, fetch each `secure_url` with an unauthenticated GET, verify status/content type and image/PDF decoding, and compare downloaded bytes/hash where provider delivery is byte-preserving. Store secure URL, public ID, returned type/size, and verification timestamp in the manifest. Any failed upload or validation remains unmapped and is retried or manually resolved; no DB pointer changes for that row.
5. **Update references only after all target objects validate:** in a separately approved, backed-up operation, replace exact old URLs in the recorded documents with validated HTTPS `secure_url` values and update corresponding `Media` metadata consistently. Use conditional updates matching the captured old value, record each modified document/field and prior value, and verify zero remaining intended legacy references. Do not run the existing backfill script as a substitute; it reconstructs local URLs and does not migrate media.
6. **Verify application behavior before cleanup:** verify every public/admin page and URL, media catalog, profile/resume, project galleries, certifications, blog covers, SEO image, user/testimonial avatars, admin upload/delete behavior, and Vercel delivery. Keep original uploads and the pre-migration DB snapshot through the agreed observation window. No old file or Cloudinary asset is automatically deleted by this plan.

### Mapping location and current counts

- Mapping artifact location: `docs/cloudinary-media-migration-manifest.csv` (keep private if the manifest later gains sensitive document identifiers). The source inventory is populated; Cloudinary public IDs and secure URLs are blank because no migration ran.
- Source files inventoried: **68**. Backup matches: **68/68**. Missing in backup: **0**. Different hashes: **0**.
- Exact duplicate groups: **13**; suspect decode failures: **7**.
- Upload attempts: **0**. Successful uploads: **0**. Upload failures: **0 (not attempted)**. Remote URL checks: **0 (not attempted)**. Database records changed: **0**. Old files removed: **0**.
- Per-file database references: **unknown**, pending approved read-only DB scan. Files missing from the current uploads directory but referenced by the database also cannot be determined without that scan.

## Rollback instructions (for a future approved run)

- Before updates, preserve a verified database snapshot plus the manifest/journal with each record's original field value. If any pointer update or application verification fails, stop further writes and restore each changed field to its recorded exact old URL using conditional updates; verify the database matches the journal.
- Keep the local `backend/uploads/` tree untouched, so legacy file bytes remain available for rollback. Do not delete Cloudinary objects during rollback; leave copied objects isolated in the migration folder until the incident is resolved. Do not overwrite a pre-existing Cloudinary object.
- If the backup/source hashes no longer match, stop and re-inventory; do not proceed with a stale manifest. Restore from the verified backup only under separate owner approval.
- A rollback is not proven until the restored old URLs are tested against a functioning legacy media host; Vercel's Express runtime will not make local `express.static()` a durable fallback.

## Approval gates

No migration is approved by this report. Before any execution, approval is required for: (a) read-only production database inventory and its handling, (b) Cloudinary account/folder and exact asset ID policy, (c) treatment of the seven corrupt/suspicious JPEGs and duplicate filenames, (d) database URL updates and rollback window, and (e) final cleanup/retention of local uploads. Production migration, database writes, file deletion, and deployment remain explicitly out of scope.
