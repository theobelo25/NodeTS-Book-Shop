import express from "express";

import {
  getProducts,
  getProduct,
  getIndex,
  getCart,
  postCart,
  getOrders,
  postCartDeleteProduct,
  getInvoice,
  getCheckout,
  getCheckoutSuccess,
} from "../controllers/shop";
import { isAuth } from "../middleware/is-auth";

const Router = express.Router();

// SHOP
// /shop => GET
Router.get("/", getIndex);

// PRODUCTS
// /products => GET
Router.get("/products", getProducts);

// PRODUCT DETAILS
// /products/:productId => GET
Router.get("/products/:productId", getProduct);

// CART
// /cart => GET
Router.get("/cart", isAuth, getCart);

// /cart => POST
Router.post("/cart", isAuth, postCart);

// /cart-delete-item => POST
Router.post("/cart-delete-item", isAuth, postCartDeleteProduct);

// ORDERS
// /orders => GET
Router.get("/orders", isAuth, getOrders);

// /orders/:orderId => GET
Router.get("/orders/:orderId", isAuth, getInvoice);

// CHECKOUT
// /checkout => GET
Router.get("/checkout", isAuth, getCheckout);
Router.get("/checkout/success", getCheckoutSuccess);
Router.get("/checkout/cancel", getCheckout);

export default Router;
