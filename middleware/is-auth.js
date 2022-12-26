const jwt = require("jsonwebtoken");

const Throw = require("../utils/throw");

module.exports = (req, _, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) Throw.AuthenticationError();
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(req.userId, decoded.userId);
    req.userId = decoded.UserInfo.userId;
    req.email = decoded.UserInfo.email;
    next();
  } catch {
    Throw.AuthorizationError("invalid token"); //invalid token
  }
};
