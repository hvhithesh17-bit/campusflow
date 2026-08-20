const mongoose = require("mongoose");

const studyTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    topic: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studyTaskSchema.index({
  user: 1,
  date: 1,
});

module.exports =
  mongoose.model(
    "StudyTask",
    studyTaskSchema
  );