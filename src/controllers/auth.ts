import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid";
import User from "../models/User";
import { validationResult } from "express-validator";
import { getError } from "../middleware/handleError";

const transporter = nodemailer.createTransport(
  sendgridTransport({
    apiKey: process.env.SG_API_KEY!,
  }),
);

export const getLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash("error"),
    oldInput: { email: "", password: "" },
    validationErrors: [],
  });
};

export const postLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array(),
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
        oldInput: { email, password },
        validationErrors: [],
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(422).render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
        oldInput: { email, password },
        validationErrors: [],
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    await req.session.save();

    res.redirect("/");
  } catch (error) {
    next(getError(error));
  }
};

export const postLogout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.session.destroy((err) => {
    console.error(err);
    res.redirect("/");
  });
};

export const getSignup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: req.flash("error"),
    oldInput: { email: "", password: "", confirmPassword: "" },
    validationErrors: [],
  });
};

export const postSignup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      validationErrors: errors.array(),
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      email,
      password: hashedPassword,
      cart: { items: [] },
    });
    await newUser.save();

    res.redirect("/login");

    await transporter.sendMail({
      to: email,
      from: "theo.belo25@gmail.com",
      subject: "Signup succeeded!",
      html: "<h1>You successfully signed up!</h1>",
    });
  } catch (error) {
    next(getError(error));
  }
};

export const getReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: req.flash("error"),
  });
};

export const postReset = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash("error", "Could not send password reset email");
        return res.redirect("/reset");
      }
      const token = buffer.toString("hex");

      const user = await User.findOne({ email });
      if (!user) {
        req.flash("error", "Could not find user.");
        return res.redirect("/reset");
      }

      user.resetToken = token;
      user.resetTokenExpiration = new Date(Date.now() + 3600000);
      await user.save();

      res.redirect("/");

      transporter.sendMail({
        to: email,
        from: "theo.belo25@gmail.com",
        subject: "Password Reset",
        html: `
          <p>You requested a password reset.</p>
          <p> Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.
        `,
      });
    });
  } catch (error) {
    next(getError(error));
  }
};

export const getNewPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    res.render("auth/new-password", {
      path: "/new-password",
      pageTitle: "Update Password",
      errorMessage: req.flash("error"),
      userId: user?._id.toString(),
      passwordToken: token,
    });
  } catch (error) {
    next(getError(error));
  }
};

export const postNewPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { password, userId, passwordToken } = req.body;

  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    });
    if (!user) {
      req.flash("error", "Could not find user.");
      return res.redirect("/reset");
    }

    const resetUser = user;
    const hashedPassword = await bcrypt.hash(password, 12);
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;

    await resetUser.save();
    res.redirect("/login");
  } catch (error) {
    next(getError(error));
  }
};
