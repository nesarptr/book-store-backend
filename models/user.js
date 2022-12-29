const { Schema, model } = require("mongoose");

const Book = require("./book");

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
  books: [
    {
      type: Schema.Types.ObjectId,
      ref: "Book",
    },
  ],
  cart: {
    items: [
      {
        bookId: {
          type: Schema.Types.ObjectId,
          ref: "Book",
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
  await Book.deleteMany({ _id: { $in: user.books } });
});

module.exports = model("User", userSchema);
