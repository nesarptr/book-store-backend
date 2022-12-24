const Throw = require("./throw");

exports.checkAuthorizedAndNotEmpty = (product, id) => {
  this.checkNotEmpty(product);
  this.checkAuth(product, id);
};

exports.checkNotEmpty = (product) => {
  !product && Throw.NotFoundError("Could not find product.");
};

exports.checkAuth = (product, id) => {
  product.owner.toString() !== id &&
    Throw.AuthorizationError("Not Authorized!");
};
