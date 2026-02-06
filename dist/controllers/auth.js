"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postNewPassword = exports.getNewPassword = exports.postReset = exports.getReset = exports.postSignup = exports.getSignup = exports.postLogout = exports.postLogin = exports.getLogin = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const nodemailer_sendgrid_1 = __importDefault(require("nodemailer-sendgrid"));
const User_1 = __importDefault(require("../models/User"));
const express_validator_1 = require("express-validator");
const handleError_1 = require("../middleware/handleError");
const transporter = nodemailer_1.default.createTransport((0, nodemailer_sendgrid_1.default)({
    apiKey: process.env.SG_API_KEY,
}));
const getLogin = async (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: req.flash("error"),
        oldInput: { email: "", password: "" },
        validationErrors: [],
    });
};
exports.getLogin = getLogin;
const postLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
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
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(422).render("auth/login", {
                path: "/login",
                pageTitle: "Login",
                errorMessage: "Invalid email or password.",
                oldInput: { email, password },
                validationErrors: [],
            });
        }
        const passwordMatches = await bcryptjs_1.default.compare(password, user.password);
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
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postLogin = postLogin;
const postLogout = async (req, res, next) => {
    req.session.destroy((err) => {
        console.error(err);
        res.redirect("/");
    });
};
exports.postLogout = postLogout;
const getSignup = async (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: req.flash("error"),
        oldInput: { email: "", password: "", confirmPassword: "" },
        validationErrors: [],
    });
};
exports.getSignup = getSignup;
const postSignup = async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    const errors = (0, express_validator_1.validationResult)(req);
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = new User_1.default({
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
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postSignup = postSignup;
const getReset = async (req, res, next) => {
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMessage: req.flash("error"),
    });
};
exports.getReset = getReset;
const postReset = async (req, res, next) => {
    const { email } = req.body;
    try {
        crypto_1.default.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash("error", "Could not send password reset email");
                return res.redirect("/reset");
            }
            const token = buffer.toString("hex");
            const user = await User_1.default.findOne({ email });
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
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postReset = postReset;
const getNewPassword = async (req, res, next) => {
    const token = req.params.token;
    try {
        const user = await User_1.default.findOne({
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
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getNewPassword = getNewPassword;
const postNewPassword = async (req, res, next) => {
    const { password, userId, passwordToken } = req.body;
    try {
        const user = await User_1.default.findOne({
            resetToken: passwordToken,
            resetTokenExpiration: { $gt: Date.now() },
            _id: userId,
        });
        if (!user) {
            req.flash("error", "Could not find user.");
            return res.redirect("/reset");
        }
        const resetUser = user;
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        await resetUser.save();
        res.redirect("/login");
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postNewPassword = postNewPassword;
