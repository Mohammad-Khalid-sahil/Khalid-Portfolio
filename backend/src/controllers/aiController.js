import { body } from "express-validator";
import { buildPortfolioKnowledge, generatePortfolioReply, suggestedQuestions } from "../services/portfolioAiService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const aiChatValidator = [
  body("message")
    .exists({ checkFalsy: true })
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),
  body("conversation")
    .optional()
    .isArray()
    .withMessage("Conversation must be an array of chat messages"),
];

export const chatWithPortfolioAgent = catchAsync(async (req, res) => {
  if (!env.AI_ENABLED) throw ApiError.serviceUnavailable("AI chat is temporarily disabled");
  const message = req.body.message || "";
  const conversation = Array.isArray(req.body.conversation) ? req.body.conversation.slice(-8) : [];
  const knowledge = await buildPortfolioKnowledge();
  const answer = await generatePortfolioReply(message, knowledge, conversation);

  sendSuccess(res, {
    message: "Portfolio AI answer generated",
    data: {
      answer,
      suggestedQuestions,
      source: "portfolio-knowledge",
      safe: true,
    },
  });
});

export const aiStatus = catchAsync(async (req, res) => {
  // Safe, non-sensitive status endpoint. Never returns keys or secrets.
  if (!env.AI_ENABLED) {
    sendSuccess(res, { message: "AI service disabled", data: { status: "disabled" } });
    return;
  }
  if (!env.AI_PROVIDER_ENABLED) {
    sendSuccess(res, { message: "AI provider calls disabled", data: { status: "provider_disabled" } });
    return;
  }
  if (!env.AI_API_KEY) {
    sendSuccess(res, { message: "AI provider not configured", data: { status: "not_configured" } });
    return;
  }

  // Try a lightweight provider check (mockable in tests). Keep it low-cost and timeboxed.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4o-mini", input: [{ role: "user", content: "status" }], max_output_tokens: 1 }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.ok) {
      sendSuccess(res, { message: "AI provider available", data: { status: "available" } });
      return;
    }
  } catch (err) {
    // fallthrough to unavailable
  }

  sendSuccess(res, { message: "AI provider unavailable", data: { status: "unavailable" } });
});
