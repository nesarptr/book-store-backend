const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const { checkNotEmpty } = require("../utils/auth-non-empty-check");
const Throw = require("../utils/throw");
const send = require("../utils/send");

exports.getAllProducts = async (_, res, __) => {
  const products = (await Product.find()).map((p) => p);
  res.status(200).json({
    message: "products successfully retrived",
    products,
  });
};

exports.getSingleProduct = async ({ params }, res, _) => {
  const prodId = params.id;
  const product = await Product.findById(prodId);
  checkNotEmpty(product);
  res.status(200).json({
    message: "prodcut successfully retrived",
    data: product,
  });
};

exports.addToCart = async ({ body, params, userId }, res, _) => {
  const productId = params.id;
  const quantity = Number(body.quantity);
  if (quantity <= 0) {
    Throw.ValidationError("Product Quantity has to be greater than zero");
  }
  const product = await Product.findById(productId);
  const user = await User.findById(userId);
  checkNotEmpty(product);
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
  res.status(201).json({
    message: "product successfully added to the cart",
    data: user.cart,
  });
};

exports.removeFromCart = async ({ params, body, userId }, res, _) => {
  const quantity = body.quantity;
  const prodId = params.id;
  const user = await User.findById(userId);
  const product = await Product.findById(prodId);
  checkNotEmpty(product);
  const prodInd = user.cart.items.findIndex(
    (p) => p.productId.toString() === prodId
  );
  if (prodInd === -1) {
    Throw.BadRequestError("Item was not found in the cart");
  }
  const oldQty = user.cart.items[prodInd].quantity;
  if (!quantity || quantity <= 0 || oldQty - quantity <= 0) {
    user.cart.items.splice(prodInd, 1);
    user.cart.totalPrice -= product.price * oldQty;
  } else {
    user.cart.totalPrice -= product.price * quantity;
  }
  await user.save();
  res.status(200).json({
    message: "successfully removed from cart",
    data: user.cart,
  });
};

exports.addOrder = async ({ userId }, res, _) => {
  const user = await User.findById(userId).populate("cart.items.productId");
  if (user.cart.items.length === 0 || user.cart.totalPrice <= 0) {
    Throw.BadRequestError("User cart is empty");
  }
  const products = user.cart.items.map((p) => {
    return { product: p.productId, quantity: p.quantity };
  });
  const order = new Order({
    products,
    price: user.cart.totalPrice,
    user: {
      email: user.email,
      userId: user._id,
    },
  });
  await order.save();
  send.orderPlacedConfirmationMail(user.email, order._id.toString());
  res.status(200).json({
    message: "order has been successfully placed",
    data: order,
  });
};
