const router = require("express").Router();

const shopController = require("../controllers/shop");

router.get("/products", shopController.getAllProducts);

router.get("/product/:id", shopController.getSingleProduct);

router.put("/product/:id", shopController.addToCart);

router.delete("/product/:id", shopController.removeFromCart);

router.post("/order", shopController.addOrder);

module.exports = router;
