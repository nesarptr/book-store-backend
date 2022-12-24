const bcrypt = require("bcryptjs");

const { handleLoginJWT, handleRefreshToken } = require("../utils/auth");
const send = require("../utils/send");
const Throw = require("../utils/throw");
const extract = require("../utils/extract");
const User = require("../models/user");

exports.signup = async ({ body }, res, _) => {
  const url = body.url || "";
  let user = await User.findOne({ email: body.email });
  if (user) {
    Throw.BadRequestError("User Already exist");
  }
  user = new User(await extract.userBody(body));
  await user.save();
  send.varificationMail(user.email, url, user.varifyToken);
  res.status(201).json({
    message: "user successfully signed up! Please varify the email",
    userId: user._id,
    varifyToken: user.varifyToken,
    varifyTokenExpiration: user.varifyTokenExpiration,
  });
};

exports.varifyMail = async ({ params }, res, _) => {
  const varifyToken = params.token;
  const user = await User.findOne({
    $and: [
      { varifyToken: { $eq: varifyToken } },
      { varifyTokenExpiration: { $gt: Date.now() } },
    ],
  });
  if (!user) {
    Throw.AuthenticationError();
  }
  user.varified = true;
  user.varifyToken = "";
  user.varifyTokenExpiration = null;
  await user.save();
  send.confirmationMail(user.email);
  res.status(200).json({
    message: "email successfully varified",
    userId: user._id,
  });
};

exports.login = async ({ body, cookies }, res, _) => {
  const url = body.url;
  const email = body.email;
  if (!email || !body.password) {
    Throw.BadRequestError();
  }
  const user = await User.findOne({ email });
  if (!user) {
    Throw.AuthenticationError();
  }
  const doMatch = await bcrypt.compare(body.password, user.password);
  if (!doMatch) {
    Throw.AuthenticationError();
  }
  if (!user.varified) {
    if (url) {
      send.varificationMail(email, url, user.varifyToken);
    }
    Throw.AuthenticationError();
  }

  const { newTokens, accessToken } = await handleLoginJWT(
    cookies,
    user._id,
    user.email,
    user.refreshTokens,
    60 * 10,
    60 * 30,
    24 * 60 * 60 * 1000,
    res,
    async (rt) => {
      return await User.findOne({ refreshTokens: rt }).exec();
    }
  );

  user.refreshTokens = newTokens;
  await user.save();
  res.status(201).json({
    message: "User Successfully Loged In",
    data: {
      userId: user._id,
      accessToken,
    },
  });
};

exports.refresh = async ({ cookies }, res, next) => {
  try {
    const accessToken = await handleRefreshToken(
      cookies,
      60 * 10,
      60 * 30,
      24 * 60 * 60 * 1000,
      res,
      async (token) => {
        return await User.findOne({ refreshTokens: token });
      },
      async (err, decoded) => {
        if (err) {
          const error = new Error("Not Authorized");
          error.statusCode = 403;
          return next(error);
        }
        //"attempted refresh token reuse!"
        const hackedUser = await User.findOne({
          _id: decoded.userId,
        }).exec();
        hackedUser.refreshTokens = [];
        await hackedUser.save();
      }
    );
    res.status(201).json({
      message: "token refreshed successfully",
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async ({ cookies }, res, _) => {
  // On client, also delete the accessToken

  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });

  // Is refreshToken in db?
  const user = await User.findOne({ refreshTokens: refreshToken }).exec();
  if (!user) {
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  user.refreshTokens = user.refreshTokens.filter((rt) => rt !== refreshToken);
  await user.save();

  res.sendStatus(204);
};
