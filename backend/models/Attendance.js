const mongoose = require("mongoose");

const attendanceSchema =
  new mongoose.Schema(
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
        index: true,
      },

      attended: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalClasses: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
    }
  );

attendanceSchema.index(
  {
    user: 1,
    subject: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "Attendance",
    attendanceSchema
  );