const jwt = require("jsonwebtoken");

const Throw = require("./throw");

exports.handleLoginJWT = async (
  cookies,
  userId,
  email,
  refreshTokens,
  expACToken,
  expRTToken,
  cookieAge,
  res,
  reuseCheck
) => {
  // create JWTs
  const accessToken = jwt.sign(
    {
      UserInfo: {
        userId,
        email,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: expACToken }
  );
  const newRefreshToken = jwt.sign(
    { userId: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: expRTToken }
  );

  // Changed to let keyword
  let newRefreshTokens = !cookies?.jwt
    ? refreshTokens
    : refreshTokens.filter((rt) => rt !== cookies.jwt);

  if (cookies?.jwt) {
    /* 
            Scenario added here: 
                1) User logs in but never uses RT and does not logout 
                2) RT is stolen
                3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
            */
    const refreshToken = cookies.jwt;
    // const oldToken = await User.findOne({ refreshTokens: refreshToken }).exec();
    const oldToken = await reuseCheck(refreshToken);

    // Detected refresh token reuse!
    if (!oldToken) {
      //attempted refresh token reuse at login!
      // clear out ALL previous refresh tokens
      newRefreshTokens = [];
    }

    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  }

  res.cookie("jwt", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "None",
    maxAge: cookieAge,
  });

  return {
    newTokens: [...newRefreshTokens, newRefreshToken],
    accessToken,
  };
};

exports.handleRefreshToken = async (
  cookies,
  expACToken,
  expRTToken,
  cookieAge,
  res,
  findByToken,
  handleHack
) => {
  // console.log(cookies.jwt);
  if (!cookies?.jwt) Throw.AuthenticationError();
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  const user = await findByToken(refreshToken);
  // Detected refresh token reuse!
  if (!user) {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, handleHack);

    Throw.AuthorizationError(); //Forbidden
  }
  const newRefreshTokens = user.refreshTokens.filter(
    (rt) => rt !== refreshToken
  );

  let accessToken;

  try {
    // evaluate jwt
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!decoded || user._id.toString() !== decoded.userId.toString()) {
      Throw.AuthorizationError();
    }
    // Refresh token was still valid
    accessToken = jwt.sign(
      {
        UserInfo: {
          userId: user._id.toString(),
          email: user.email,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: expACToken }
    );
    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: expRTToken }
    );
    // Saving refreshToken with current user
    user.refreshTokens = [...newRefreshTokens, newRefreshToken];
    await user.save();

    // Creates Secure Cookie with refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: cookieAge,
    });
  } catch (err) {
    if (err) {
      //"expired refresh token"
      user.refreshTokens = [...newRefreshTokens];
      await user.save();
    }
  }

  return accessToken;
};
