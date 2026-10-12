import Tag from "../models/Tag.js";
import BlogPost from "../models/BlogPost.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { slugify } from "../utils/slugify.js";
import { getOne, queryResourceList, updateOne } from "../utils/handlerFactory.js";

export const getTags = catchAsync(async (req, res) => {
  const { docs: tags, meta } = await queryResourceList(Tag, req, { defaultSort: "name" });
  sendSuccess(res, { message: "Tags retrieved", data: tags, meta });
});

export const createTag = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.slug) payload.slug = slugify(payload.name);
  const tag = await Tag.create(payload);
  sendSuccess(res, { statusCode: 201, message: "Tag created", data: tag });
});

export const getTag = getOne(Tag);
export const updateTag = updateOne(Tag);
export const deleteTag = catchAsync(async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw ApiError.notFound("Tag not found");

  await BlogPost.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });
  await tag.deleteOne();
  sendSuccess(res, { message: "Tag deleted" });
});
