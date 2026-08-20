const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    college: {
      type: String,
      default: "",
      trim: true,
    },

    branch: {
      type: String,
      default: "",
      trim: true,
    },

    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
    },

    notifications: {
    assignmentReminders: {
    type: Boolean,
    default: true,
   },

    attendanceAlerts: {
    type: Boolean,
    default: true,
    },

    studyReminders: {
    type: Boolean,
    default: true,
    },

  examReminders: {
    type: Boolean,
    default: true,
  },
  },

appearance: {
  type: String,
  enum: ["light", "dark", "system"],
  default: "system",
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);