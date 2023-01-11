const router = require("express").Router();
const { body } = require("express-validator");

const shopController = require("../controllers/shop");

router.get("/books", shopController.getAllBooks);

router.get("/book/:id", shopController.getSingleBook);

router.put("/book/:id", shopController.addToCart);

router.delete("/book/:id", shopController.removeFromCart);

router.post(
  "/cart",
  body("cart", "cart has to be a non-empty array").isArray(),
  shopController.postCart
);

router.get("/cart", shopController.getCart);

router.get("/order", shopController.order);

router.post("/order", shopController.addOrder);

router.post("/pay/:id", shopController.pay);

router.put("/pay/:secret", shopController.confirmPay);

module.exports = router;
