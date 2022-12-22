const router = require("express").Router();

const adminController = require("../controllers/admin");

router.post("/product", adminController.addNewProduct);

router.get("/products", adminController.getAllProducts);

router.put("/product/:id", adminController.editProduct);

router.delete("/product/:id", adminController.deleteProduct);
