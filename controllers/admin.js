const User = require("../models/user");
const Product = require("../models/product");

exports.addNewProduct = async (req, res, next) => {
  const userId = req.body.userId;
  const name = req.body.name;
  const price = req.body.price;
  const imgURL = req.body.imgURL;
  const description = req.body.description;

  const product = new Product({
    owner: userId,
    name,
    description,
    price,
    imgURL,
  });

  await product.save();

  res.status(201).json({
    message: "successfully product is created",
    product,
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

exports.deleteProduct = async (req, res, next) => {
  const prodId = req.params.id;
  const userId = req.body.userId;
  const product = await Product.findById(prodId);
  checkAuthorizedAndNotEmpty(product, userId);
  const user = await User.findById(userId);
  const deleteData = await product.delete();
  user.products = user.products.filter((p) => p._id !== deleteData._id);
  await user.save();
  res.status(200).json({
    message: "Delete Operation Successfull",
    deleteData,
  });
};

function checkAuthorizedAndNotEmpty(product, id) {
  if (!product) {
    const error = new Error("Could not find product.");
    error.statusCode = 404;
    throw error;
  }
  if (product.owner.toString() !== id) {
    const error = new Error("Not authorized!");
    error.statusCode = 403;
    throw error;
  }
}
