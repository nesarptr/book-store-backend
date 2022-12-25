const Throw = require("../utils/throw");
const User = require("../models/user");
const Product = require("../models/product");
const { checkAuthorizedAndNotEmpty } = require("../utils/auth-non-empty-check");
const { productBody: extractProductBody } = require("../utils/extract");
const send = require("../utils/send");

exports.addNewProduct = async ({ body, email }, res, _) => {
  const prods = body.products;
  let message;
  let data;
  if (!prods) {
    const product = new Product(extractProductBody(body));
    await product.save();
    message = "successfully product is created";
    data = product;
    send.productCreatedConfirmationMail(email, product._id.toString());
  } else {
    const products = [];
    const productData = prods.map((p) =>
      new Product(extractProductBody(p)).save()
    );
    for await (const prod of productData) {
      send.productCreatedConfirmationMail(email, prod._id.toString());
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

exports.getAllProducts = async ({ userId }, res, _) => {
  const products = (await Product.find({ owner: userId })).map(
    (product) => product
  );
  if (!products) {
    Throw.NotFoundError("Product Not Fount");
  }
  res.status(200).json({
    message: "all data successfully retrived",
    data: products,
  });
};

exports.getProduct = async ({ params, userId }, res, _) => {
  const prodId = params.id;
  const product = await Product.findById(prodId);

  checkAuthorizedAndNotEmpty(product, userId);
  res.status(200).json({
    message: "product successfully retrived",
    data: product,
  });
};

exports.editProduct = async ({ params, body, userId }, res, _) => {
  const prodId = params.id;
  const product = await Product.findById(prodId);

  checkAuthorizedAndNotEmpty(product, userId);

  product.name = body.name || product.name;
  product.price = body.price || product.price;
  product.imgURL = body.imgURL || product.imgURL;
  product.description = body.description || product.description;
  await product.save();
  res.status(200).json(product);
};

exports.deleteProduct = async ({ params, userId }, res, _) => {
  const prodId = params.id;
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
