import Media from "../models/Media.js";
import Project from "../models/Project.js";
import Certification from "../models/Certification.js";
import Profile from "../models/Profile.js";
import BlogPost from "../models/BlogPost.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { storeUpload, deleteStoredUpload } from "./storage.js";

const DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);

/** Builds the absolute public URL for legacy local media URLs. */
export function buildFileUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(filename)}`;
}

/** Stores a validated in-memory upload and creates its Media catalog record. */
export async function recordMedia({ req, file, usedIn = "other", storedUpload, preserveStoredOnError = false }) {
  const stored = storedUpload || await storeUpload(file, req);
  const category = DOCUMENT_MIME_TYPES.has(file.mimetype) ? "document" : "image";
  const originalName = String(file.originalname || "upload").replace(/[\\/]/g, "_").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "upload";
  try {
    return await Media.create({
      filename: stored.filename,
      storageKey: stored.storageKey,
      storageProvider: stored.storageProvider,
      originalName,
      url: stored.url,
      mimeType: file.mimetype,
      size: file.size,
      category,
      usedIn,
      uploadedBy: req.user?._id,
    });
  } catch (error) {
    if (!preserveStoredOnError) await deleteStoredUpload(stored).catch(() => {});
    throw error;
  }
}
/**
 * Finds every existing document that references a given file URL, across
 * all the resources that store image/document URLs as plain strings
 * (there's no real foreign key for these fields â€” this is how the
 * project already models them, so this reads across all of them instead
 * of introducing a new relational layer).
 *
 * Used to warn an admin, before they delete a file, exactly what will be
 * affected â€” and by clearMediaReferences() below to actually clean up
 * those references so nothing is left silently broken.
 */
export async function findMediaUsage(url) {
  const [projectsByThumbnail, projectsByGallery, certifications, profile, posts, settings, users] = await Promise.all([
    Project.find({ thumbnail: url }).select("title"),
    Project.find({ gallery: url }).select("title"),
    Certification.find({ image: url }).select("name"),
    Profile.find({ $or: [{ avatar: url }, { resumeUrl: url }] }).select("name avatar resumeUrl"),
    BlogPost.find({ cover: url }).select("title"),
    Settings.find({ "seo.ogImage": url }).select("siteTitle"),
    User.find({ avatar: url }).select("name"),
  ]);

  const usage = [];
  projectsByThumbnail.forEach((p) => usage.push({ resource: "project", id: p._id, label: p.title, field: "thumbnail" }));
  projectsByGallery.forEach((p) => usage.push({ resource: "project", id: p._id, label: p.title, field: "gallery" }));
  certifications.forEach((c) => usage.push({ resource: "certification", id: c._id, label: c.name, field: "image" }));
  profile.forEach((p) => {
    if (p.avatar === url) usage.push({ resource: "profile", id: p._id, label: "Profile photo", field: "avatar" });
    if (p.resumeUrl === url) usage.push({ resource: "profile", id: p._id, label: "Resume / CV", field: "resumeUrl" });
  });
  posts.forEach((post) => usage.push({ resource: "blog", id: post._id, label: post.title, field: "cover" }));
  settings.forEach((item) => usage.push({ resource: "settings", id: item._id, label: item.siteTitle, field: "seo.ogImage" }));
  users.forEach((item) => usage.push({ resource: "user", id: item._id, label: item.name, field: "avatar" }));

  return usage;
}

/**
 * Clears every reference to `url` found across the resources above â€”
 * called right before a Media file is actually deleted, so a deleted file
 * never leaves a broken image/link behind on the public site.
 */
export async function clearMediaReferences(url) {
  const [projThumb, projGallery, certs, profileAvatar, profileResume, posts, settings, users] = await Promise.all([
    Project.updateMany({ thumbnail: url }, { $set: { thumbnail: null } }),
    Project.updateMany({ gallery: url }, { $pull: { gallery: url } }),
    Certification.updateMany({ image: url }, { $set: { image: null } }),
    Profile.updateMany({ avatar: url }, { $set: { avatar: null } }),
    Profile.updateMany({ resumeUrl: url }, { $set: { resumeUrl: null } }),
    BlogPost.updateMany({ cover: url }, { $set: { cover: null } }),
    Settings.updateMany({ "seo.ogImage": url }, { $set: { "seo.ogImage": "" } }),
    User.updateMany({ avatar: url }, { $set: { avatar: null } }),
  ]);

  const clearedCount =
    projThumb.modifiedCount +
    projGallery.modifiedCount +
    certs.modifiedCount +
    profileAvatar.modifiedCount +
    profileResume.modifiedCount +
    posts.modifiedCount;
  return clearedCount + settings.modifiedCount + users.modifiedCount;
}


