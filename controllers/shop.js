const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const { checkNotEmpty } = require("../utils/auth-non-empty-check");

exports.getAllProducts = async (_, res, __) => {
  const products = (await Product.find()).map((p) => p);
  res.status(200).json({
    message: "products successfully retrived",
    products,
  });
};

exports.getSingleProduct = async (req, res, _) => {
  const prodId = req.params.id;
  const product = await Product.findById(prodId);
  checkNotEmpty(product);
  res.status(200).json({
    message: "prodcut successfully retrived",
    data: product,
  });
};

exports.addToCart = async (req, res, _) => {
  const productId = req.params.id;
  const quantity = Number(req.body.quantity);
  const userId = req.body.userId;
  const product = await Product.findById(productId);
  const user = await User.findById(userId);
  checkNotEmpty(product);
  checkNotEmpty(user);
  const prodInd = user.cart.items.findIndex(
    (p) => p.productId.toString() === productId
  );
  let oldQty;
  if (prodInd !== -1) {
    oldQty = user.cart.items[prodInd].quantity;
    user.cart.items[prodInd].quantity = quantity;
  } else {
    user.cart.items.push({ productId, quantity });
  }

  user.cart.totalPrice -= Number(product.price) * oldQty;
  user.cart.totalPrice += Number(product.price) * quantity;
  await user.save();
  res.status(200).json({
    message: "product successfully added to the cart",
    data: user.cart,
  });
};

exports.removeFromCart = async (req, res, _) => {
  const prodId = req.params.id;
  const userId = req.body.userId;
  const user = await User.findById(userId);
  const product = await Product.findById(prodId);
  checkNotEmpty(user);
  checkNotEmpty(product);
  const prodInd = user.cart.items.findIndex(
    (p) => p.productId.toString() === prodId
  );
  const quantity = user.cart.items[prodInd].quantity;
  user.cart.items.splice(prodInd, 1);
  user.cart.totalPrice -= product.price * quantity;
  await user.save();
  res.status(200).json({
    message: "successfully removed from cart",
    data: user.cart,
  });
};

exports.addOrder = async (req, res, _) => {
  const userId = req.body.userId;
  const user = await User.findById(userId).populate("cart.items.productId");
  const products = user.cart.items.map((p) => {
    return { product: p.productId, quantity: p.quantity };
  });
  checkNotEmpty(user);
  const order = new Order({
    products,
    price: user.cart.totalPrice,
    user: {
      email: user.email,
      userId: user._id,
    },
  });
  await order.save();
  res.status(200).json({
    message: "order has been successfully placed",
    data: order,
  });
};
