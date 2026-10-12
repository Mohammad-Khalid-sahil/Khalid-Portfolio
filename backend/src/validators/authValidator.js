import { body } from "express-validator";

export const loginValidator = [
  body("email").trim().notEmpty().isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];
