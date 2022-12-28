const crypto = require("crypto");

const bcrypt = require("bcryptjs");

exports.productBody = (body) => {
  const name = body.name;
  const price = body.price;
  const description = body.description;
  const owner = body.userId;
  return {
    name,
    price,
    description,
    owner,
  };
};

exports.userBody = async (
  /** @type {{ name: string; email: String; password: string; }} */ body
) => {
  const oneHour = 3600000;
  const oneMinute = 60000;
  const name = body.name;
  const email = body.email;
  // @ts-ignore
  const password = await bcrypt.hash(body.password, +process.env.HASH_SALT);
  const varifyToken = crypto.randomBytes(64).toString("hex");
  const varifyTokenExpiration = Date.now() + oneHour + oneMinute;
  return {
    name,
    email,
    password,
    varifyToken,
    varifyTokenExpiration,
  };
};
