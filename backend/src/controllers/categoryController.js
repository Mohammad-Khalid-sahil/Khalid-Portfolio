import Category from "../models/Category.js";
import BlogPost from "../models/BlogPost.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { slugify } from "../utils/slugify.js";
import { getOne, queryResourceList, updateOne } from "../utils/handlerFactory.js";

export const getCategories = catchAsync(async (req, res) => {
  const { docs: categories, meta } = await queryResourceList(Category, req, { defaultSort: "name" });
  sendSuccess(res, { message: "Categories retrieved", data: categories, meta });
});

export const createCategory = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.slug) payload.slug = slugify(payload.name);
  const category = await Category.create(payload);
  sendSuccess(res, { statusCode: 201, message: "Category created", data: category });
});

export const getCategory = getOne(Category);
export const updateCategory = updateOne(Category);
export const deleteCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");

  await BlogPost.updateMany({ category: category._id }, { $unset: { category: 1 } });
  await category.deleteOne();
  sendSuccess(res, { message: "Category deleted" });
});
