exports.checkAuthorizedAndNotEmpty = (product, id) => {
  this.checkNotEmpty(product);
  this.checkAuth(product, id);
};

exports.checkNotEmpty = (item) => {
  if (!item) {
    const error = new Error("Could not find item.");
    error.statusCode = 404;
    throw error;
  }
};

exports.checkAuth = (product, id) => {
  if (product.owner.toString() !== id) {
    const error = new Error("Not authorized!");
    error.statusCode = 403;
    throw error;
  }
};
