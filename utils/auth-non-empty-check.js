const Throw = require("./throw");

exports.checkAuthorizedAndNotEmpty = (book, id) => {
  this.checkNotEmpty(book);
  this.checkAuth(book, id);
};

exports.checkNotEmpty = (book) => {
  !book && Throw.NotFoundError("Could not find book.");
};

exports.checkAuth = (book, id) => {
  book.owner.toString() !== id && Throw.AuthorizationError("Not Authorized!");
};
