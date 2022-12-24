exports.AuthenticationError = (message = "Authentication Failed!") => {
  const error = new Error(message);
  error.statusCode = 401;
  throw error;
};

exports.AuthorizationError = (message = "Authorization Failed") => {
  const error = new Error(message);
  error.statusCode = 403;
  throw error;
};

exports.NotFoundError = (message = "Resource Not Found") => {
  const error = new Error(message);
  error.statusCode = 404;
  throw error;
};

exports.BadRequestError = (message = "Bad Request") => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

exports.ValidationError = (message = "Validation Failed") => {
  const error = new Error(message);
  error.statusCode = 422;
  throw error;
};
