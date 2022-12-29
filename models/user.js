const { Schema, model } = require("mongoose");

const Product = require("./book");

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  varifyToken: String,
  varifyTokenExpiration: Date,
  varified: {
    type: Boolean,
    default: false,
    required: true,
  },
  refreshTokens: [String],
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
});

userSchema.post("remove", async (user) => {
  await Product.deleteMany({ _id: { $in: user.products } });
});

module.exports = model("User", userSchema);
