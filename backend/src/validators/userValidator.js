import { body, param } from "express-validator";

export const userIdParamValidator = [
  param("id").isMongoId().withMessage("Invalid user id"),
];

export const createUserValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  body("role").optional().isIn(["admin", "editor"]).withMessage("Role must be admin or editor"),
  body("avatar").optional().isString().withMessage("Avatar must be a string"),
];

export const updateUserValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().trim().isEmail().withMessage("Valid email is required"),
  body("password").optional().isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  body("role").optional().isIn(["admin", "editor"]).withMessage("Role must be admin or editor"),
  body("avatar").optional().isString().withMessage("Avatar must be a string"),
];
