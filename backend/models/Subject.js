const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      default: "",
      trim: true,
    },

    credits: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },

    faculty: {
      type: String,
      default: "",
      trim: true,
    },

    color: {
      type: String,
      default: "#2563eb",
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({
  user: 1,
  name: 1,
});

module.exports =
  mongoose.model("Subject", subjectSchema);