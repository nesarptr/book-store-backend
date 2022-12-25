exports.AuthenticationError = (message = "Authentication Failed!", next) => {
  const error = new Error(message);
  error.statusCode = 401;
  if (!next) {
    throw error;
  }
  next(error);
};

exports.AuthorizationError = (message = "Not Authorized!", next) => {
  const error = new Error(message);
  error.statusCode = 403;
  if (!next) {
    throw error;
  }
  next(error);
};

exports.NotFoundError = (message = "404 Not Found", next) => {
  const error = new Error(message);
  error.statusCode = 404;
  if (!next) {
    throw error;
  }
  next(error);
};

exports.BadRequestError = (message = "Bad Request", next) => {
  const error = new Error(message);
  error.statusCode = 400;
  if (!next) {
    throw error;
  }
  next(error);
};

exports.ValidationError = (message = "Validation Failed", next) => {
  const error = new Error(message);
  error.statusCode = 422;
  if (!next) {
    throw error;
  }
  next(error);
};
