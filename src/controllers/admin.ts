import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

import Product from "../models/Product";
import { getError } from "../middleware/handleError";
import { deleteFile } from "../util/file";

const ITEMS_PER_PAGE = 2;

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page } = req.query;
  const pageNum = Number(page) || 1;

  try {
    const numProducts = await Product.find().countDocuments();
    const products = await Product.find({ userId: req.user?._id })
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
  } catch (error) {
    next(getError(error));
  }
};

export const getAddProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Products",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: "",
    validationErrors: [],
  });
};

export const postAddProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user,
  });

  const errors = validationResult(req);
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
  } catch (error) {
    next(getError(error));
  }
};

export const getEditProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const productId = req.params.productId as string;
  const editMode = req.query.edit;
  if (!editMode) return res.redirect("/admin/products");

  try {
    const product = await Product.findById(productId);
    if (!product) res.redirect("/admin/products");

    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      product,
      editing: editMode,
      hasError: false,
      errorMessage: "",
      validationErrors: [],
    });
  } catch (error) {
    next(getError(error));
  }
};

export const postEditProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { productId, title, price, description } = req.body;
  const image = req.file;

  const errors = validationResult(req);
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
    const product = await Product.findById(productId);
    if (!product) return res.redirect("/admin/products");
    if (product.userId.toString() !== req.user?._id.toString())
      return res.redirect("/");

    if (image) {
      deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    product.title = title;
    product.price = price;
    product.description = description;

    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    next(getError(error));
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) return next(new Error("Product not found"));
    deleteFile(product.imageUrl);

    await Product.deleteOne({ _id: productId, userId: req.user?._id });
    res.status(200).json({ message: "Success!" });
  } catch (error) {
    res.status(500).json({ message: "Deleting product failed." });
  }
};
