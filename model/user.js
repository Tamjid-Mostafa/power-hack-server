const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        default: null
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
  },
  { collection: "users" }
);

const model = mongoose.model("users", UserSchema);
module.exports = model;
