"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAddProduct = exports.getAddProduct = exports.getCart = exports.getAdminProducts = exports.getProducts = exports.getShop = void 0;
const Product_1 = require("../models/Product");
const getShop = (req, res, next) => {
    res.render("shop/index", {
        pageTitle: "Shop",
        path: "/shop",
        forsmCSS: true,
        productCSS: true,
        activeAddProduct: true,
    });
};
exports.getShop = getShop;
const getProducts = (req, res, next) => {
    Product_1.Product.fetchAll((products) => {
        res.render("shop/product-list", {
            pageTitle: "Products",
            products,
            path: "/product-list",
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true,
        });
    });
};
exports.getProducts = getProducts;
const getAdminProducts = (req, res, next) => {
    Product_1.Product.fetchAll((products) => {
        res.render("admin/product-list", {
            pageTitle: "Products",
            products,
            path: "/admin/product-list",
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true,
        });
    });
};
exports.getAdminProducts = getAdminProducts;
const getCart = (req, res, next) => {
    Product_1.Product.fetchAll((products) => {
        res.render("shop/cart", {
            pageTitle: "Cart",
            products,
            path: "/cart",
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true,
        });
    });
};
exports.getCart = getCart;
const getAddProduct = (req, res, next) => {
    res.render("admin/add-product", {
        pageTitle: "Add Products",
        path: "/admin/add-product",
        forsmCSS: true,
        productCSS: true,
        activeAddProduct: true,
    });
};
exports.getAddProduct = getAddProduct;
const postAddProduct = (req, res, next) => {
    const product = new Product_1.Product(req.body.title);
    product.save();
    res.redirect("/");
};
exports.postAddProduct = postAddProduct;
