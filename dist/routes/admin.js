"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const admin_1 = require("../controllers/admin");
const is_auth_1 = require("../middleware/is-auth");
const Router = express_1.default.Router();
// PRODUCT-LIST
// /admin/product-list => GET
Router.get("/products", is_auth_1.isAuth, admin_1.getProducts);
// ADD-PRODUCT
// /admin/add-product => GET
Router.get("/add-product", is_auth_1.isAuth, admin_1.getAddProduct);
// /admin/add-product => POST
Router.post("/add-product", [
    (0, express_validator_1.body)("title")
        .isString()
        .isLength({ min: 3 })
        .trim()
        .withMessage("Please make sure Title has at least 3 characters."),
    (0, express_validator_1.body)("price")
        .isFloat()
        .isLength({ min: 3 })
        .trim()
        .withMessage("Please make sure Price is a valid number, with 2 decimal places."),
    (0, express_validator_1.body)("description")
        .isLength({ min: 5, max: 400 })
        .trim()
        .withMessage("Please make sure Description is between 5 and 400 characters long."),
], is_auth_1.isAuth, admin_1.postAddProduct);
// EDIT PRODUCT
// /admin/edit-product => GET
Router.get("/edit-product/:productId", is_auth_1.isAuth, admin_1.getEditProduct);
// /admin/edit-product => POST
Router.post("/edit-product", [
    (0, express_validator_1.body)("title").isString().isLength({ min: 3 }).trim(),
    (0, express_validator_1.body)("price").isFloat().isLength({ min: 3 }).trim(),
    (0, express_validator_1.body)("description").isLength({ min: 5, max: 400 }).trim(),
], is_auth_1.isAuth, admin_1.postEditProduct);
// DELETE PRODUCT
// /admin/delete-product => POST
Router.delete("/product/:productId", is_auth_1.isAuth, admin_1.deleteProduct);
exports.default = Router;
