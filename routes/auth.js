const router = require("express").Router();

const authController = require("../controllers/auth");

router.post("/signup", authController.signup);

router.put("/varify/:token", authController.varifyMail);

router.post("/login", authController.login);

router.put("/refresh", authController.refresh);

router.delete("/logout", authController.logout);

module.exports = router;
