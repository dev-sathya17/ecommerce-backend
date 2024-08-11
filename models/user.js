const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["customer", "admin", "vendor"],
  },
  isPrime: {
    type: Boolean,
    default: false,
  },
  authString: {
    type: String,
    default: "",
  },
  addresses: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    default: [],
  },
  cards: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card",
      },
    ],
    default: [],
  },
  wishlists: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wishlist",
      },
    ],
    default: [],
  },
});

module.exports = mongoose.model("User", userSchema, "users");
