const router = require("express").Router();

const adminController = require("../controllers/admin");

router.post("/product", adminController.addNewProduct);

router.get("/products", adminController.getAllProducts);

router.get("/product/:id", adminController.getProduct);

router.put("/product/:id", adminController.editProduct);

router.delete("/product/:id", adminController.deleteProduct);

module.exports = router;
