const router = require("express").Router();
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");

router.post(
  "/signup",
  [
    body("name", "Name Has to be a non-empty valid String")
      .trim()
      .isString()
      .notEmpty(),
    body("email", "invalid email")
      .trim()
      .notEmpty()
      .isString()
      .isEmail()
      .normalizeEmail(),
    body("password", "Password has to be at least 6 character long")
      .trim()
      .isLength({ min: 6 }),
  ],
  authController.signup
);

router.put("/varify/:token", authController.varifyMail);

router.post(
  "/login",
  [
    body("email", "invalid email")
      .trim()
      .notEmpty()
      .isString()
      .isEmail()
      .normalizeEmail(),
    body("password", "Password has to be at least 6 character long")
      .trim()
      .isLength({ min: 6 }),
  ],
  authController.login
);

router.put("/refresh", authController.refresh);

router.delete("/logout", authController.logout);

router.get("/isAuth", isAuth, (req, res) => {
  res.status(200).json({
    message: "valid token",
    // @ts-ignore
    userId: req.userId,
    // @ts-ignore
    email: req.email,
  });
});

module.exports = router;
