const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/book");
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

exports.getSingleProduct = async ({ params }, res, next) => {
  try {
    const prodId = params.id;
    const product = await Product.findById(prodId);
    checkNotEmpty(product);
    res.status(200).json({
      message: "prodcut successfully retrived",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async ({ body, params, userId }, res, next) => {
  try {
    const productId = params.id;
    const quantity = Number(body.quantity);
    if (quantity <= 0) {
      Throw.ValidationError("Product Quantity has to be greater than zero");
    }
    const product = await Product.findById(productId);
    const user = await User.findById(userId);
    checkNotEmpty(product);
    // @ts-ignore
    const prodInd = user.cart.items.findIndex(
      (p) => p.productId.toString() === productId
    );
    let oldQty;
    if (prodInd !== -1) {
      // @ts-ignore
      oldQty = user.cart.items[prodInd].quantity;
      // @ts-ignore
      user.cart.items[prodInd].quantity = quantity;
    } else {
      // @ts-ignore
      user.cart.items.push({ productId, quantity });
    }

    // @ts-ignore
    user.cart.totalPrice -= Number(product.price) * oldQty;
    // @ts-ignore
    user.cart.totalPrice += Number(product.price) * quantity;
    // @ts-ignore
    await user.save();
    res.status(201).json({
      message: "product successfully added to the cart",
      // @ts-ignore
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async ({ params, userId }, res, next) => {
  try {
    const prodId = params.id;
    const user = await User.findById(userId);
    const product = await Product.findById(prodId);
    checkNotEmpty(product);
    // @ts-ignore
    const prodInd = user.cart.items.findIndex(
      (p) => p.productId.toString() === prodId
    );
    if (prodInd === -1) {
      Throw.BadRequestError("Item was not found in the cart");
    }
    // @ts-ignore
    const oldQty = user.cart.items[prodInd].quantity;
    // @ts-ignore
    user.cart.items.splice(prodInd, 1);
    // @ts-ignore
    user.cart.totalPrice -= product.price * oldQty;
    // @ts-ignore
    await user.save();
    res.status(200).json({
      message: "successfully removed from cart",
      // @ts-ignore
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.addOrder = async ({ userId }, res, next) => {
  try {
    const user = await User.findById(userId).populate("cart.items.productId");
    // @ts-ignore
    if (user.cart.items.length === 0 || user.cart.totalPrice <= 0) {
      Throw.BadRequestError("User cart is empty");
    }
    // @ts-ignore
    const products = user.cart.items.map((p) => {
      return { product: p.productId, quantity: p.quantity };
    });
    const order = new Order({
      products,
      // @ts-ignore
      price: user.cart.totalPrice,
      user: {
        // @ts-ignore
        email: user.email,
        // @ts-ignore
        userId: user._id,
      },
    });
    await order.save();
    // @ts-ignore
    send.orderPlacedConfirmationMail(user.email, order._id.toString());
    res.status(200).json({
      message: "order has been successfully placed",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
