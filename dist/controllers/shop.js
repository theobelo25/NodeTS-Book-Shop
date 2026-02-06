"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoice = exports.getCheckoutSuccess = exports.getCheckout = exports.getOrders = exports.postCartDeleteProduct = exports.postCart = exports.getCart = exports.getProduct = exports.getProducts = exports.getIndex = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const stripe_1 = require("../util/stripe");
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const mongodb_1 = require("mongodb");
const handleError_1 = require("../middleware/handleError");
const mongoose_1 = require("mongoose");
const constants_1 = require("../util/constants");
const getIndex = async (req, res, next) => {
    const { page } = req.query;
    const pageNum = Number(page) || 1;
    try {
        const numProducts = await Product_1.default.find().countDocuments();
        const products = await Product_1.default.find()
            .skip((pageNum - 1) * constants_1.ITEMS_PER_PAGE)
            .limit(constants_1.ITEMS_PER_PAGE);
        res.render("shop/index", {
            pageTitle: "Shop",
            products: products,
            path: "/",
            currentPage: pageNum,
            hasNextPage: constants_1.ITEMS_PER_PAGE * pageNum < numProducts,
            hasPreviousPage: pageNum > 1,
            nextPage: pageNum + 1,
            previousPage: pageNum - 1,
            lastPage: Math.ceil(numProducts / constants_1.ITEMS_PER_PAGE),
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getIndex = getIndex;
const getProducts = async (req, res, next) => {
    const { page } = req.query;
    const pageNum = Number(page) || 1;
    try {
        const numProducts = await Product_1.default.find().countDocuments();
        const products = await Product_1.default.find()
            .skip((pageNum - 1) * constants_1.ITEMS_PER_PAGE)
            .limit(constants_1.ITEMS_PER_PAGE);
        res.render("shop/product-list", {
            pageTitle: "Shop",
            products,
            path: "/",
            currentPage: pageNum,
            hasNextPage: constants_1.ITEMS_PER_PAGE * pageNum < numProducts,
            hasPreviousPage: pageNum > 1,
            nextPage: pageNum + 1,
            previousPage: pageNum - 1,
            lastPage: Math.ceil(numProducts / constants_1.ITEMS_PER_PAGE),
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getProducts = getProducts;
const getProduct = async (req, res, next) => {
    const productId = req.params.productId;
    try {
        const product = await Product_1.default.findById(productId);
        res.render("shop/product-detail", {
            pageTitle: product?.title,
            product,
            path: `/products`,
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getProduct = getProduct;
const getCart = async (req, res, next) => {
    const user = await req.user?.populate("cart.items.productId");
    const products = user?.cart.items;
    res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products,
    });
};
exports.getCart = getCart;
const postCart = async (req, res, next) => {
    const { productId } = req.body;
    try {
        const product = await Product_1.default.findById(productId);
        if (product)
            await req.user?.addToCart(product);
        res.redirect("/cart");
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postCart = postCart;
const postCartDeleteProduct = async (req, res, next) => {
    const { productId } = req.body;
    try {
        await req.user?.deleteItemFromCart(productId);
        res.redirect("/cart");
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.postCartDeleteProduct = postCartDeleteProduct;
const getOrders = async (req, res, next) => {
    try {
        const orders = await Order_1.default.find({ "user.userId": req.user });
        res.render("shop/orders", {
            path: "/orders",
            pageTitle: "Your Orders",
            orders,
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getOrders = getOrders;
const getCheckout = async (req, res, next) => {
    let total = 0;
    try {
        const user = await req.user?.populate("cart.items.productId");
        if (!user)
            return next(new Error("Could not retrieve user."));
        const products = user.cart.items;
        products.forEach((p) => {
            if (!p.productId || p.productId instanceof mongodb_1.ObjectId)
                return next(new Error("Products could not be populated on order."));
            total += p.quantity * p.productId.price;
        });
        const lineItems = products.map((p) => {
            const product = p.productId;
            if (!product || product instanceof mongoose_1.Types.ObjectId)
                return {};
            return {
                price_data: {
                    currency: "cad",
                    unit_amount: product.price * 100,
                    product_data: {
                        name: product.title,
                        description: product.description,
                    },
                },
                quantity: p.quantity,
            };
        });
        const session = await stripe_1.stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
            cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
        });
        res.render("shop/checkout", {
            path: "/checkout",
            pageTitle: "Checkout",
            products,
            total,
            sessionId: session.id,
            sessionUrl: session.url,
        });
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getCheckout = getCheckout;
const getCheckoutSuccess = async (req, res, next) => {
    try {
        const user = await req.user?.populate("cart.items.productId");
        const products = user?.cart.items.map((i) => {
            if (i.productId instanceof mongodb_1.ObjectId)
                return res.redirect("/cart");
            return { quantity: i.quantity, productId: { ...i.productId } };
        });
        const order = new Order_1.default({
            user: {
                userId: req.user,
            },
            products,
        });
        await order.save();
        await req.user?.clearCart();
        res.redirect("/orders");
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getCheckoutSuccess = getCheckoutSuccess;
const getInvoice = async (req, res, next) => {
    const { orderId } = req.params;
    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicePath = path_1.default.join("dist", "data", "invoices", invoiceName);
    try {
        const order = await Order_1.default.findById(orderId);
        if (!order)
            return next(new Error("No order found"));
        if (order.user.userId.toString() !== req.user?._id.toString())
            return next(new Error("Unauthorized"));
        const pdfDoc = new pdfkit_1.default();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
        pdfDoc.pipe(fs_1.default.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text(`Invoice - ${orderId}`, {
            underline: true,
        });
        pdfDoc.fontSize(14).text("------------------------------");
        if (!order.products)
            return next(new Error("Products could not be accessed."));
        let totalPrice = 0;
        order.products.forEach((p) => {
            const product = p.productId;
            if (!product || product instanceof mongoose_1.Types.ObjectId)
                return next(new Error("Products could not be populated on order."));
            totalPrice += p.quantity * product.price;
            pdfDoc
                .fontSize(14)
                .text(`${product.title} - ${p.quantity} x $${product.price}`);
        });
        pdfDoc.fontSize(14).text("------------------------------");
        pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);
        pdfDoc.end();
    }
    catch (error) {
        next((0, handleError_1.getError)(error));
    }
};
exports.getInvoice = getInvoice;
