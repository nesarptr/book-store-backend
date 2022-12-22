const router = require("express").Router();

const shopController = require("../controllers/shop");

router.get("/products", shopController.getAllProducts);

router.get("/product/:id", shopController.getSingleProduct);

router.post("/product/:id", shopController.addToCart);

router.delete("/product/:id", shopController.removeFromCart);

router.delete("/products", shopController.removeWholeCart);

router.post("/order", shopController.addOrder);
