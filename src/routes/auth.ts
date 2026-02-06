import express from "express";
import { body } from "express-validator";

import User from "../models/User";
import {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} from "../controllers/auth";

const Router = express.Router();

// LOGIN
Router.get("/login", getLogin);
Router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail(),
    body("password", "Please enter a password with a minimum of 5 characters")
      .isLength({ min: 5 })
      .trim(),
  ],
  postLogin,
);
Router.post("/logout", postLogout);
Router.get("/signup", getSignup);
Router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom(async (value, { req }) => {
        const user = await User.findOne({ email: value });
        if (user) {
          throw new Error("Email already exists, please use another.");
        }
      })
      .normalizeEmail(),
    body("password", "Please enter a password with a minimum of 5 characters")
      .isLength({ min: 5 })
      .trim(),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password)
          throw new Error("Passwords do not match!");
        return true;
      })
      .trim(),
  ],
  postSignup,
);
Router.get("/reset", getReset);
Router.post("/reset", postReset);
Router.get("/reset/:token", getNewPassword);
Router.post("/new-password", postNewPassword);

export default Router;
