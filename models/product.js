const User = require("../models/user");
const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0.1,
  },
  imgURL: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  description: String,
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

productSchema.post("save", async (product) => {
  const user = await User.findById(product.owner);
  if (!user.products.includes(product._id)) {
    user.products.push(product._id);
  }
  await user.save();
});

productSchema.post("remove", async (product) => {
  const user = await User.findById(product.owner);
  user.products = user.products.filter(
    (p) => p.toString() !== product._id.toString()
  );
  await user.save();
});

module.exports = model("Product", productSchema);
