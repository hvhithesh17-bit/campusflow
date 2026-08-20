const mongoose = require("mongoose");

const subjectPredictionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    credits: {
      type: Number,
      required: true,
      min: 0,
    },

    ia1: {
      type: Number,
      default: 0,
    },

    ia2: {
      type: Number,
      default: 0,
    },

    ia3: {
      type: Number,
      default: 0,
    },

    predictedMarks: {
      type: Number,
      default: 0,
    },

    predictedGrade: {
      type: String,
      default: "",
    },

    gradePoint: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const gradePredictionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    semester: {
      type: Number,
      required: true,
      index: true,
    },

    predictedSGPA: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    totalCredits: {
      type: Number,
      default: 0,
    },

    subjects: {
      type: [subjectPredictionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

gradePredictionSchema.index({
  user: 1,
  semester: 1,
});

module.exports = mongoose.model(
  "GradePrediction",
  gradePredictionSchema
);