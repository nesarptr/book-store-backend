const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const { handleLoginJWT, handleRefreshToken } = require("../utils/auth");
const send = require("../utils/send");
const Throw = require("../utils/throw");
const extract = require("../utils/extract");
const User = require("../models/user");

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Throw.ValidationError(errors.array()[0].msg);
    }
    const body = req.body;
    const url = body.url || req;
    let user = await User.findOne({ email: body.email });
    if (user) {
      Throw.BadRequestError(
        "E-Mail exists already, please pick a different one."
      );
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
  } catch (error) {
    next(error);
  }
};

exports.varifyMail = async ({ params }, res, next) => {
  try {
    const varifyToken = params.token;
    const user = await User.findOne({
      $and: [
        { varifyToken: { $eq: varifyToken } },
        { varifyTokenExpiration: { $gt: Date.now() } },
      ],
    });
    if (!user) {
      Throw.AuthenticationError("Invalid Token");
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
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Throw.ValidationError(errors.array()[0].msg);
    }
    const body = req.body;
    const cookies = req.cookies;
    const url = body.url;
    const email = body.email;
    const user = await User.findOne({ email });
    if (!user) {
      Throw.AuthenticationError("Email or Password is incorrect");
    }
    const doMatch = await bcrypt.compare(body.password, user.password);
    if (!doMatch) {
      Throw.AuthenticationError("Email or Password is incorrect");
    }
    if (!user.varified) {
      if (url) {
        send.varificationMail(email, url, user.varifyToken);
      }
      Throw.AuthenticationError("User did not Verify his/her email");
    }

    const { newTokens, accessToken } = await handleLoginJWT(
      cookies,
      user._id,
      user.email,
      user.refreshTokens,
      60 * 15,
      60 * 60,
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
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  const cookies = req.cookies;
  try {
    const accessToken = await handleRefreshToken(
      cookies,
      60 * 15,
      60 * 60,
      24 * 60 * 60 * 1000,
      res,
      async (token) => {
        return await User.findOne({ refreshTokens: token });
      },
      async (err, decoded) => {
        if (err) {
          return Throw.AuthorizationError("Not Authorized", next);
        }
        //"attempted refresh token reuse!"
        const hackedUser = await User.findOne({
          _id: decoded.UserInfo.userId,
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
