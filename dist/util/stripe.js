"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const secretKey = process.env.STRIPE_SECRET_KEY;
exports.stripe = new stripe_1.default(secretKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
});
