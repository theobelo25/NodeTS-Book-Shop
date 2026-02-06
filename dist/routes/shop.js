"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shop_1 = require("../controllers/shop");
const is_auth_1 = require("../middleware/is-auth");
const Router = express_1.default.Router();
// SHOP
// /shop => GET
Router.get("/", shop_1.getIndex);
// PRODUCTS
// /products => GET
Router.get("/products", shop_1.getProducts);
// PRODUCT DETAILS
// /products/:productId => GET
Router.get("/products/:productId", shop_1.getProduct);
// CART
// /cart => GET
Router.get("/cart", is_auth_1.isAuth, shop_1.getCart);
// /cart => POST
Router.post("/cart", is_auth_1.isAuth, shop_1.postCart);
// /cart-delete-item => POST
Router.post("/cart-delete-item", is_auth_1.isAuth, shop_1.postCartDeleteProduct);
// ORDERS
// /orders => GET
Router.get("/orders", is_auth_1.isAuth, shop_1.getOrders);
// /orders/:orderId => GET
Router.get("/orders/:orderId", is_auth_1.isAuth, shop_1.getInvoice);
// CHECKOUT
// /checkout => GET
Router.get("/checkout", is_auth_1.isAuth, shop_1.getCheckout);
Router.get("/checkout/success", shop_1.getCheckoutSuccess);
Router.get("/checkout/cancel", shop_1.getCheckout);
exports.default = Router;
