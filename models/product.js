const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
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
  },
});

module.exports = model("Product", productSchema);
