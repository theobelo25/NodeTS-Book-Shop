"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.postEditProduct = exports.getEditProduct = exports.postAddProduct = exports.getAddProduct = exports.getProducts = void 0;
const express_validator_1 = require("express-validator");
const Product_1 = __importDefault(require("../models/Product"));
const handleError_1 = require("../middleware/handleError");
const file_1 = require("../util/file");
const ITEMS_PER_PAGE = 2;
const getProducts = async (req, res, next) => {
    const { page } = req.query;
    const pageNum = Number(page) || 1;
    try {
        const numProducts = await Product_1.default.find().countDocuments();
        const products = await Product_1.default.find({ userId: req.user?._id })
            .skip((pageNum - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
        res.render("admin/products", {
            pageTitle: "Admin Products",
            products,
            path: "/admin/products",
            currentPage: pageNum,
            hasNextPage: ITEMS_PER_PAGE * pageNum < numProducts,
            hasPreviousPage: pageNum > 1,
            nextPage: pageNum + 1,
            previousPage: pageNum - 1,
            lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE),
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getProducts = getProducts;
const getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Products",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: "",
        validationErrors: [],
    });
};
exports.getAddProduct = getAddProduct;
const postAddProduct = async (req, res, next) => {
    const { title, price, description } = req.body;
    const image = req.file;
    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }
    const imageUrl = image.path;
    const product = new Product_1.default({
        title,
        price,
        description,
        imageUrl,
        userId: req.user,
    });
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: [],
        });
    }
    try {
        await product.save();
        res.redirect("/admin/products");
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postAddProduct = postAddProduct;
const getEditProduct = async (req, res, next) => {
    const productId = req.params.productId;
    const editMode = req.query.edit;
    if (!editMode)
        return res.redirect("/admin/products");
    try {
        const product = await Product_1.default.findById(productId);
        if (!product)
            res.redirect("/admin/products");
        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            product,
            editing: editMode,
            hasError: false,
            errorMessage: "",
            validationErrors: [],
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getEditProduct = getEditProduct;
const postEditProduct = async (req, res, next) => {
    const { productId, title, price, description } = req.body;
    const image = req.file;
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
                _id: productId,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }
    try {
        const product = await Product_1.default.findById(productId);
        if (!product)
            return res.redirect("/admin/products");
        if (product.userId.toString() !== req.user?._id.toString())
            return res.redirect("/");
        if (image) {
            (0, file_1.deleteFile)(product.imageUrl);
            product.imageUrl = image.path;
        }
        product.title = title;
        product.price = price;
        product.description = description;
        await product.save();
        res.redirect("/admin/products");
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postEditProduct = postEditProduct;
const deleteProduct = async (req, res, next) => {
    const { productId } = req.params;
    try {
        const product = await Product_1.default.findById(productId);
        if (!product)
            return next(new Error("Product not found"));
        (0, file_1.deleteFile)(product.imageUrl);
        await Product_1.default.deleteOne({ _id: productId, userId: req.user?._id });
        res.status(200).json({ message: "Success!" });
    }
    catch (error) {
        res.status(500).json({ message: "Deleting product failed." });
    }
};
exports.deleteProduct = deleteProduct;
