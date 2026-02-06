import express from "express";
import { body } from "express-validator";

import {
  getAddProduct,
  postAddProduct,
  getProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct,
} from "../controllers/admin";
import { isAuth } from "../middleware/is-auth";

const Router = express.Router();

// PRODUCT-LIST
// /admin/product-list => GET
Router.get("/products", isAuth, getProducts);

// ADD-PRODUCT
// /admin/add-product => GET
Router.get("/add-product", isAuth, getAddProduct);

// /admin/add-product => POST
Router.post(
  "/add-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Please make sure Title has at least 3 characters."),
    body("price")
      .isFloat()
      .isLength({ min: 3 })
      .trim()
      .withMessage(
        "Please make sure Price is a valid number, with 2 decimal places.",
      ),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage(
        "Please make sure Description is between 5 and 400 characters long.",
      ),
  ],
  isAuth,
  postAddProduct,
);

// EDIT PRODUCT
// /admin/edit-product => GET
Router.get(
  "/edit-product/:productId",

  isAuth,
  getEditProduct,
);

// /admin/edit-product => POST
Router.post(
  "/edit-product",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("price").isFloat().isLength({ min: 3 }).trim(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
  ],
  isAuth,
  postEditProduct,
);

// DELETE PRODUCT
// /admin/delete-product => POST
Router.delete("/product/:productId", isAuth, deleteProduct);

export default Router;
