const router = require("express").Router();

const shopController = require("../controllers/shop");

router.get("/books", shopController.getAllBooks);

router.get("/book/:id", shopController.getSingleBook);

router.put("/book/:id", shopController.addToCart);

router.delete("/book/:id", shopController.removeFromCart);

router.post("/order", shopController.addOrder);

module.exports = router;
