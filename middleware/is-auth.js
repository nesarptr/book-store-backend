const Throw = require("../utils/throw");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) Throw.AuthenticationError();
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch {
    Throw.AuthorizationError("invalid token"); //invalid token
  }
};
