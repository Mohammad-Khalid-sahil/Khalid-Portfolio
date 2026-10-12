import Testimonial from "../models/Testimonial.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { ApiError } from "../utils/ApiError.js";
import { queryResourceList, updateOne, deleteOne } from "../utils/handlerFactory.js";

export const getTestimonials = catchAsync(async (req, res) => {
  const { docs, meta } = await queryResourceList(Testimonial, req, { filter: { approved: true }, defaultSort: "order -createdAt" });
  sendSuccess(res, { message: "Testimonials retrieved", data: docs, meta });
});

export const getAdminTestimonials = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status === "approved") filter.approved = true;
  if (req.query.status === "pending" || req.query.status === "unapproved" || req.query.status === "rejected") {
    filter.approved = false;
  }

  const { docs, meta } = await queryResourceList(Testimonial, req, { filter, defaultSort: "order -createdAt" });
  sendSuccess(res, { message: "Testimonials retrieved", data: docs, meta });
});

export const getTestimonial = catchAsync(async (req, res) => {
  const doc = await Testimonial.findOne({ _id: req.params.id, approved: true });
  if (!doc) throw ApiError.notFound("Testimonial not found");
  sendSuccess(res, { message: "Testimonial retrieved", data: doc });
});
export const createTestimonial = catchAsync(async (req, res) => {
  const isStaff = req.user && ["admin", "editor"].includes(req.user.role);
  const payload = { ...req.body };

  if (!isStaff) {
    payload.approved = false;
  } else if (typeof payload.approved !== "boolean") {
    payload.approved = Boolean(payload.approved);
  }

  const doc = await Testimonial.create(payload);
  sendSuccess(res, { statusCode: 201, message: "Testimonial created", data: doc });
});
export const updateTestimonial = updateOne(Testimonial);
export const deleteTestimonial = deleteOne(Testimonial);
