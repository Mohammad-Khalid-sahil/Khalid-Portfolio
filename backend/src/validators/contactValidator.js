import { body } from "express-validator";

export const contactValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .matches(/^[^\r\n]*$/)
    .withMessage("Name must not contain line breaks"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email address"),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ max: 150 })
    .matches(/^[^\r\n]*$/)
    .withMessage("Subject must not contain line breaks"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters"),
  // Honeypot field — real users never fill this; bots usually do.
  body("website").optional().isEmpty().withMessage("Spam detected"),
];
