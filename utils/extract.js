const crypto = require("crypto");

exports.productBody = (body) => {
  const name = body.name;
  const price = body.price;
  const description = body.description;
  const imgURL = body.imgURL;
  const owner = body.userId;
  return {
    name,
    price,
    description,
    imgURL,
    owner,
  };
};

exports.userBody = async (body) => {
  const oneHour = 3600000;
  const oneMinute = 60000;
  const name = body.name;
  const email = body.email;
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
