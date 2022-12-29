const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Throw = require("../utils/throw");
const User = require("../models/user");
const Book = require("../models/book");
const { checkAuthorizedAndNotEmpty } = require("../utils/auth-non-empty-check");
const { bookBody: extractbookBody } = require("../utils/extract");
const send = require("../utils/send");

exports.addNewBook = async (req, res, next) => {
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
    const bookBody = { ...extractbookBody(body), imgURL: req.file.path };
    const book = new Book(bookBody);
    await book.save();
    user?.books.push(book._id);
    send.bookCreatedConfirmationMail(email, book._id.toString());
    await user?.save();
    res.status(201).json({
      message: "successfully book is created",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBooks = async ({ userId }, res, next) => {
  try {
    const books = (await Book.find({ owner: userId })).map(
      (book) => book
    );
    if (!books || books.length === 0) {
      Throw.NotFoundError("The user does not have any book");
    }
    res.status(200).json({
      message: "all data successfully retrived",
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

exports.editBook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Throw.ValidationError(errors.array()[0].msg);
    }
    const params = req.params;
    const body = req.body;
    const userId = req.userId;
    body.userId = userId;
    const bookId = params.id;
    const book = await Book.findById(bookId);

    checkAuthorizedAndNotEmpty(book, userId);

    // @ts-ignore
    book.name = body.name;
    // @ts-ignore
    book.price = body.price;
    // @ts-ignore
    book.imgURL = req.file ? req.file.path : book.imgURL;
    // @ts-ignore
    book.description = body.description;
    // @ts-ignore
    await book.save();
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async ({ params, userId, email }, res, next) => {
  try {
    const bookId = params.id;
    const book = await Book.findById(bookId);
    checkAuthorizedAndNotEmpty(book, userId);
    const user = await User.findById(userId);
    // @ts-ignore
    const deleteBook = await book.remove();
    clearImage(deleteBook.imgURL);
    // @ts-ignore
    user?.books = user?.books.filter((p) => !p.equals(deleteBook._id));
    // @ts-ignore
    await user.save();
    send.bookDeletedConfirmationMail(email, deleteBook._id);
    res.status(200).json({
      message: "Delete Operation Successfull",
      deleteData: deleteBook,
    });
  } catch (error) {
    next(error);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
