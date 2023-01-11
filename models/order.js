const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
  books: {
    type: [
      {
        book: { type: Object, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    required: true,
  },
  price: Number,
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  secret: String,
  user: {
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
});

module.exports = model("Order", orderSchema);
