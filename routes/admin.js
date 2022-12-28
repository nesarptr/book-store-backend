const router = require("express").Router();

const { body } = require("express-validator");

const adminController = require("../controllers/admin");

router.post(
  "/product",
  body(
    "name",
    "name has to be a non-empty valid String at least 2 character long"
  )
    .trim()
    .isString()
    .isLength({ min: 2 }),
  body("price", "price has to be a valid float number")
    .toFloat()
    .custom((price) => {
      if (price <= 0) {
        throw new Error("price has to be greater than zero");
      }
      return true;
    }),
  body(
    "description",
    "description has to be a non-empty valid string between 5 to 400 character"
  )
    .trim()
    .isString()
    .isLength({ min: 5, max: 400 }),
  adminController.addNewProduct
);

router.get("/products", adminController.getAllProducts);

router.put(
  "/product/:id",
  body(
    "name",
    "name has to be a non-empty valid String at least 2 character long"
  )
    .trim()
    .isString()
    .isLength({ min: 2 }),
  body("price", "price has to be a valid float number")
    .toFloat()
    .custom((price) => {
      if (price <= 0) {
        throw new Error("price has to be greater than zero");
      }
      return true;
    }),
  body(
    "description",
    "description has to be a non-empty valid string between 5 to 400 character"
  )
    .trim()
    .isString()
    .isLength({ min: 5, max: 400 }),
  adminController.editProduct
);

router.delete("/product/:id", adminController.deleteProduct);

module.exports = router;
