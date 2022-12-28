const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Throw = require("../utils/throw");
const User = require("../models/user");
const Product = require("../models/product");
const { checkAuthorizedAndNotEmpty } = require("../utils/auth-non-empty-check");
const { productBody: extractProductBody } = require("../utils/extract");
const send = require("../utils/send");

exports.addNewProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Throw.ValidationError(errors.array()[0].msg);
    }
    const email = req.email;
    const body = req.body;
    body.userId = req.userId;
    if (!req.file) {
      Throw.ValidationError("No File Picked");
    }
    const user = await User.findById(body.userId);
    const prodBody = { ...extractProductBody(body), imgURL: req.file.path };
    const product = new Product(prodBody);
    await product.save();
    user.products.push(product._id);
    send.productCreatedConfirmationMail(email, product._id.toString());
    await user.save();
    res.status(201).json({
      message: "successfully product is created",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllProducts = async ({ userId }, res, next) => {
  try {
    const products = (await Product.find({ owner: userId })).map(
      (product) => product
    );
    if (!products || products.length === 0) {
      Throw.NotFoundError("The user does not have any product");
    }
    res.status(200).json({
      message: "all data successfully retrived",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

exports.editProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Throw.ValidationError(errors.array()[0].msg);
    }
    const params = req.params;
    const body = req.body;
    const userId = req.userId;
    body.userId = userId;
    const prodId = params.id;
    const product = await Product.findById(prodId);

    checkAuthorizedAndNotEmpty(product, userId);

    product.name = body.name;
    product.price = body.price;
    product.imgURL = req.file ? req.file.path : product.imgURL;
    product.description = body.description;
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async ({ params, userId, email }, res, next) => {
  try {
    const prodId = params.id;
    const product = await Product.findById(prodId);
    checkAuthorizedAndNotEmpty(product, userId);
    const user = await User.findById(userId);
    const deleteProduct = await product.remove();
    clearImage(deleteProduct.imgURL);
    user.products = user.products.filter((p) => !p.equals(deleteProduct._id));
    await user.save();
    send.productDeletedConfirmationMail(email, deleteProduct._id);
    res.status(200).json({
      message: "Delete Operation Successfull",
      deleteData: deleteProduct,
    });
  } catch (error) {
    next(error);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
