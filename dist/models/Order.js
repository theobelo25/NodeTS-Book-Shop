"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    products: [
        {
            productId: { type: Object, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    user: {
        userId: {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
});
const Order = (0, mongoose_1.model)("Orders", orderSchema);
exports.default = Order;
