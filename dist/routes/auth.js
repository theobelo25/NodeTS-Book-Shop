"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../controllers/auth");
const Router = express_1.default.Router();
// LOGIN
Router.get("/login", auth_1.getLogin);
Router.post("/login", [
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Please enter a valid email.")
        .normalizeEmail(),
    (0, express_validator_1.body)("password", "Please enter a password with a minimum of 5 characters")
        .isLength({ min: 5 })
        .trim(),
], auth_1.postLogin);
Router.post("/logout", auth_1.postLogout);
Router.get("/signup", auth_1.getSignup);
Router.post("/signup", [
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Please enter a valid email.")
        .custom(async (value, { req }) => {
        const user = await User_1.default.findOne({ email: value });
        if (user) {
            throw new Error("Email already exists, please use another.");
        }
    })
        .normalizeEmail(),
    (0, express_validator_1.body)("password", "Please enter a password with a minimum of 5 characters")
        .isLength({ min: 5 })
        .trim(),
    (0, express_validator_1.body)("confirmPassword")
        .custom((value, { req }) => {
        if (value !== req.body.password)
            throw new Error("Passwords do not match!");
        return true;
    })
        .trim(),
], auth_1.postSignup);
Router.get("/reset", auth_1.getReset);
Router.post("/reset", auth_1.postReset);
Router.get("/reset/:token", auth_1.getNewPassword);
Router.post("/new-password", auth_1.postNewPassword);
exports.default = Router;
