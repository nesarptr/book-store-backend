const User = require("../models/user");
const Product = require("../models/product");
const { checkAuthorizedAndNotEmpty } = require("../utils/auth-non-empty-check");
const { productBody: extractProductBody } = require("../utils/extract");

exports.addNewProduct = async (req, res, _) => {
  const prods = req.body.products;
  let message;
  let data;
  if (!prods) {
    const product = new Product(extractProductBody(req.body));
    await product.save();
    message = "successfully product is created";
    data = product;
  } else {
    const products = [];
    const productData = prods.map((p) =>
      new Product(extractProductBody(p)).save()
    );
    for await (const prod of productData) {
      products.push(prod);
    }
    message = "successfully products are created";
    data = products;
  }
  res.status(201).json({
    message,
    data,
  });
};

exports.getAllProducts = async (req, res, _) => {
  const userId = req.body.userId;
  const products = (await Product.find({ owner: userId })).map(
    (product) => product
  );
  res.status(200).json({
    message: "all data successfully retrived",
    products,
  });
};

exports.getProduct = async (req, res, _) => {
  const prodId = req.params.id;
  const userId = req.body.userId;
  const product = await Product.findById(prodId);

  checkAuthorizedAndNotEmpty(product, userId);
  res.status(200).json(product);
};

exports.editProduct = async (req, res, _) => {
  const prodId = req.params.id;
  const userId = req.body.userId;
  const product = await Product.findById(prodId);

  checkAuthorizedAndNotEmpty(product, userId);

  product.name = req.body.name || product.name;
  product.price = req.body.price || product.price;
  product.imgURL = req.body.imgURL || product.imgURL;
  product.description = req.body.description || product.description;
  await product.save();
  res.status(200).json(product);
};

exports.deleteProduct = async (req, res, _) => {
  const prodId = req.params.id;
  const userId = req.body.userId;
  const product = await Product.findById(prodId);
  checkAuthorizedAndNotEmpty(product, userId);
  const user = await User.findById(userId);
  const deleteData = await product.remove();
  user.products = user.products.filter((p) => p._id !== deleteData._id);
  await user.save();
  res.status(200).json({
    message: "Delete Operation Successfull",
    deleteData,
  });
};
