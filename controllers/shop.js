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

exports.addOrder = async ({ userId }, res, next) => {
  try {
    const user = await User.findById(userId).populate("cart.items.bookId");
    // @ts-ignore
    if (user.cart.items.length === 0 || user.cart.totalPrice <= 0) {
      Throw.BadRequestError("User cart is empty");
    }
    // @ts-ignore
    const books = user.cart.items.map((p) => {
      return { book: p.bookId, quantity: p.quantity };
    });
    const order = new Order({
      books: books,
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

exports.order = async (req, res, next) => {
  try {
    const orders = (await Order.find({ "user.userId": req.userId })).map(
      (o) => {
        return {
          books: o.books,
          price: o.price,
        };
      }
    );
    res.status(200).json({
      message: "orders are successfully retrived",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
