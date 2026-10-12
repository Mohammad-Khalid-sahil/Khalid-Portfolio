import Message from "../models/Message.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { ApiError } from "../utils/ApiError.js";
import { sendContactNotification } from "../integrations/email/mailer.js";

export const submitContactMessage = catchAsync(async (req, res) => {
  const { name, email, subject, message, website } = req.body;

  // Honeypot: bots fill hidden fields, real users leave them blank.
  if (website) {
    // Pretend success so bots don't learn the honeypot was tripped.
    return sendSuccess(res, { statusCode: 201, message: "Message sent successfully!" });
  }

  const saved = await Message.create({
    name,
    email,
    subject,
    message,
    ip: req.ip,
  });

  await sendContactNotification({ name, email, subject, message });

  sendSuccess(res, { statusCode: 201, message: "Message sent successfully!", data: { id: saved._id } });
});

export const getMessages = catchAsync(async (req, res) => {
  const messages = await Message.find().sort("-createdAt");
  sendSuccess(res, { message: "Messages retrieved", data: messages, meta: { count: messages.length } });
});

export const markMessageRead = catchAsync(async (req, res) => {
  const msg = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!msg) throw ApiError.notFound("Message not found");
  sendSuccess(res, { message: "Message updated", data: msg });
});

export const deleteMessage = catchAsync(async (req, res) => {
  const msg = await Message.findByIdAndDelete(req.params.id);
  if (!msg) throw ApiError.notFound("Message not found");
  sendSuccess(res, { message: "Message deleted" });
});
