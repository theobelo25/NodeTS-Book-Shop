"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: { type: Number, required: true },
            },
        ],
    },
});
userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex((ci) => ci.productId?.toString() === product._id?.toString());
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity,
        });
    }
    const updatedCart = {
        items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
};
userSchema.methods.deleteItemFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter((ci) => ci.productId?.toString() !== productId.toString());
    this.cart.items = updatedCartItems;
    return this.save();
};
userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
};
const User = (0, mongoose_1.model)("User", userSchema);
exports.default = User;
