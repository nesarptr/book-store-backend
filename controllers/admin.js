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
    const prods = body.products;
    const user = await User.findById(body.userId);
    let message;
    let data;
    if (!prods) {
      const product = new Product(extractProductBody(body));
      await product.save();
      message = "successfully product is created";
      data = product;
      user.products.push(product._id);
      send.productCreatedConfirmationMail(email, product._id.toString());
    } else {
      const products = [];
      const productData = prods.map((p) =>
        new Product(extractProductBody(p)).save()
      );
      for await (const prod of productData) {
        user.products.push(prod._id);
        send.productCreatedConfirmationMail(email, prod._id.toString());
        products.push(prod);
      }
      message = "successfully products are created";
      data = products;
    }
    await user.save();
    res.status(201).json({
      message,
      data,
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
      Throw.NotFoundError("Product Not Fount");
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
    product.imgURL = body.imgURL || product.imgURL;
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
