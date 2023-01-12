const { validationResult } = require("express-validator");
// @ts-ignore
// @ts-ignore
const { v4: uuidv4 } = require("uuid");
// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_KEY, {
  apiVersion: "2022-11-15",
});

const Order = require("../models/order");
const User = require("../models/user");
const Book = require("../models/book");
const { checkNotEmpty } = require("../utils/auth-non-empty-check");
const Throw = require("../utils/throw");
const send = require("../utils/send");

exports.getAllBooks = async (_, res, __) => {
  const books = (await Book.find()).map((p) => p);
  res.status(200).json({
    message: "books successfully retrived",
    books: books,
  });
};

exports.getSingleBook = async ({ params }, res, next) => {
  try {
    const bookId = params.id;
    const book = await Book.findById(bookId);
    checkNotEmpty(book);
    res.status(200).json({
      message: "book successfully retrived",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async ({ body, params, userId }, res, next) => {
  try {
    const bookId = params.id;
    const quantity = Number(body.quantity);
    if (quantity <= 0) {
      Throw.ValidationError("Book Quantity has to be greater than zero");
    }
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);
    checkNotEmpty(book);
    // @ts-ignore
    const bookInd = user.cart.items.findIndex(
      (p) => p.bookId.toString() === bookId
    );
    let oldQty;
    if (bookInd !== -1) {
      // @ts-ignore
      oldQty = user.cart.items[bookInd].quantity;
      // @ts-ignore
      user.cart.items[bookInd].quantity = quantity;
    } else {
      // @ts-ignore
      user.cart.items.push({ bookId: bookId, quantity });
    }

    // @ts-ignore
    user.cart.totalPrice -= Number(book.price) * oldQty;
    // @ts-ignore
    user.cart.totalPrice += Number(book.price) * quantity;
    // @ts-ignore
    await user.save();
    res.status(201).json({
      message: "book successfully added to the cart",
      // @ts-ignore
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async ({ params, userId }, res, next) => {
  try {
    const bookId = params.id;
    const user = await User.findById(userId);
    const book = await Book.findById(bookId);
    checkNotEmpty(book);
    // @ts-ignore
    const bookInd = user.cart.items.findIndex(
      (p) => p.bookId.toString() === bookId
    );
    if (bookInd === -1) {
      Throw.BadRequestError("Item was not found in the cart");
    }
    // @ts-ignore
    const oldQty = user.cart.items[bookInd].quantity;
    // @ts-ignore
    user.cart.items.splice(bookInd, 1);
    // @ts-ignore
    user.cart.totalPrice -= book.price * oldQty;
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

// @ts-ignore
exports.postCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Throw.ValidationError(errors.array()[0].msg);
    }
    const user = await User.findById(req?.userId);
    const items = req?.body?.cart;
    // @ts-ignore
    let total = 0;

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      // @ts-ignore
      total += item.quantity * book?.price;
    }

    // @ts-ignore
    user.cart.items = items;
    // @ts-ignore
    user.cart.totalPrice = total;

    await user?.save();

    res.status(201).json({ cart: user?.cart });
  } catch (error) {
    next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate("cart.items.bookId");
    const books = user?.cart?.items.map((p) => {
      return { book: p.bookId, quantity: p.quantity };
    });
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

// @ts-ignore
exports.addOrder = async ({ userId }, res, next) => {
  try {
    const user = await User.findById(userId);
    // @ts-ignore
    if (user.cart.items.length === 0 || user.cart.totalPrice <= 0) {
      Throw.BadRequestError("User cart is empty");
    }

    // @ts-ignore
    const books = [];
    // @ts-ignore
    for (const { bookId, quantity } of user.cart.items) {
      const book = await Book.findById(bookId);
      books.push({
        book,
        quantity,
      });
    }
    const order = new Order({
      books,
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
    user.cart.items = [];
    // @ts-ignore
    user.cart.totalPrice = 0;

    await user?.save();
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

exports.order = async (req, res, next) => {
  try {
    const orders = (await Order.find({ "user.userId": req.userId })).map(
      (o) => {
        return {
          id: o._id,
          books: o.books,
          price: o.price,
          status: o.isPaid,
        };
      }
    );
    res.status(200).json({
      message: "orders are successfully retrived",
      orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.pay = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      Throw.ValidationError("invalid order");
    }
    if (order?.isPaid) {
      Throw.ValidationError("the amount for this order is already paid");
    }

    let paymentIntent;

    if (order?.paymentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(order.paymentId);
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        // @ts-ignore
        amount: order?.price * 100, // 25
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        receipt_email: req.email,
      });

      // @ts-ignore
      order.paymentId = paymentIntent.id;

      await order?.save();
    }

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

// @ts-ignore
exports.confirmPay = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const order = await Order.findOne({ paymentId });
    if (!order) {
      Throw.ValidationError("invalid id");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    console.log("intent: ", paymentIntent);
    paymentIntent && console.log(paymentIntent?.status);

    if (paymentIntent.status !== "succeeded") {
      Throw.BadRequestError("user did not pay the amount");
    }
    // @ts-ignore
    (order.isPaid = true), (order.paymentId = ""), await order?.save();

    send.paymentSuccessEmail(req.email, order?._id);
    res.status(200).json({
      message: "Payment successful",
    });
  } catch (error) {
    next(error);
  }
};
