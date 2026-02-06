import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { stripe } from "../util/stripe";

import Product from "../models/Product";
import Order from "../models/Order";
import { ObjectId } from "mongodb";
import { getError } from "../middleware/handleError";
import { Types } from "mongoose";
import Stripe from "stripe";

const ITEMS_PER_PAGE = 2;

export const getIndex = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page } = req.query;
  const pageNum = Number(page) || 1;

  try {
    const numProducts = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((pageNum - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("shop/index", {
      pageTitle: "Shop",
      products: products,
      path: "/",
      currentPage: pageNum,
      hasNextPage: ITEMS_PER_PAGE * pageNum < numProducts,
      hasPreviousPage: pageNum > 1,
      nextPage: pageNum + 1,
      previousPage: pageNum - 1,
      lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE),
    });
  } catch (error) {
    next(getError(error));
  }
};

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page } = req.query;
  const pageNum = Number(page) || 1;

  try {
    const numProducts = await Product.find().countDocuments();
    const products = await Product.find()
      .skip((pageNum - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render("shop/product-list", {
      pageTitle: "Shop",
      products,
      path: "/",
      currentPage: pageNum,
      hasNextPage: ITEMS_PER_PAGE * pageNum < numProducts,
      hasPreviousPage: pageNum > 1,
      nextPage: pageNum + 1,
      previousPage: pageNum - 1,
      lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE),
    });
  } catch (error) {
    next(getError(error));
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    res.render("shop/product-detail", {
      pageTitle: product?.title,
      product,
      path: `/products`,
    });
  } catch (error) {
    next(getError(error));
  }
};

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = await req.user?.populate("cart.items.productId");
  const products = user?.cart.items;

  res.render("shop/cart", {
    pageTitle: "Your Cart",
    path: "/cart",
    products,
  });
};

export const postCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { productId } = req.body;
  try {
    const product = await Product.findById(productId);
    if (product) await req.user?.addToCart(product);
    res.redirect("/cart");
  } catch (error) {
    next(getError(error));
  }
};

export const postCartDeleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { productId } = req.body;
  try {
    await req.user?.deleteItemFromCart(productId);

    res.redirect("/cart");
  } catch (error) {
    next(getError(error));
  }
};

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = await Order.find({ "user.userId": req.user });

    res.render("shop/orders", {
      path: "/orders",
      pageTitle: "Your Orders",
      orders,
    });
  } catch (error) {
    next(getError(error));
  }
};

export const getCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let total = 0;

  try {
    const user = await req.user?.populate("cart.items.productId");
    if (!user) return next(new Error("Could not retrieve user."));

    const products = user.cart.items;
    products.forEach((p) => {
      if (!p.productId || p.productId instanceof ObjectId)
        return next(new Error("Products could not be populated on order."));

      total += p.quantity * p.productId.price;
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      products.map((p) => {
        const product = p.productId;
        if (!product || product instanceof Types.ObjectId) return {};

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

    const session = await stripe.checkout.sessions.create({
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
  } catch (error) {
    next(getError(error));
  }
};

export const getCheckoutSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await req.user?.populate("cart.items.productId");
    const products = user?.cart.items.map((i) => {
      if (i.productId instanceof ObjectId) return res.redirect("/cart");
      return { quantity: i.quantity, productId: { ...i.productId } };
    });

    const order = new Order({
      user: {
        userId: req.user,
      },
      products,
    });

    await order.save();
    await req.user?.clearCart();

    res.redirect("/orders");
  } catch (error) {
    next(getError(error));
  }
};

export const getInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { orderId } = req.params;
  const invoiceName = `invoice-${orderId}.pdf`;
  const invoicePath = path.join("dist", "data", "invoices", invoiceName);

  try {
    const order = await Order.findById(orderId);
    if (!order) return next(new Error("No order found"));

    if (order.user.userId.toString() !== req.user?._id.toString())
      return next(new Error("Unauthorized"));

    const pdfDoc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
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
      if (!product || product instanceof Types.ObjectId)
        return next(new Error("Products could not be populated on order."));

      totalPrice += p.quantity * product.price;
      pdfDoc
        .fontSize(14)
        .text(`${product.title} - ${p.quantity} x $${product.price}`);
    });

    pdfDoc.fontSize(14).text("------------------------------");
    pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);

    pdfDoc.end();
  } catch (error) {
    next(getError(error));
  }
};
