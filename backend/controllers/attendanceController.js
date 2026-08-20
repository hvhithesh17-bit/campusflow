const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");

/* =========================================
   GET ATTENDANCE
========================================= */

const getAttendance = async (
  req,
  res
) => {
  try {
    const records =
      await Attendance.find({
        user: req.user.userId,
      })
        .populate(
          "subject",
          "name code credits color"
        )
        .sort({
          createdAt: -1,
        });

    const attendance =
      records.map((record) => {
        const attended =
          Number(
            record.attended || 0
          );

        const totalClasses =
          Number(
            record.totalClasses || 0
          );

        const percentage =
          totalClasses > 0
            ? Math.round(
                (attended /
                  totalClasses) *
                  100
              )
            : 0;

        return {
          _id: record._id,

          subject:
            record.subject,

          attended,

          totalClasses,

          percentage,
        };
      });

    res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error(
      "GET ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load attendance",
    });
  }
};

/* =========================================
   SAVE ATTENDANCE
========================================= */

const saveAttendance = async (
  req,
  res
) => {
  try {
    const {
      subjectId,
      attended,
      totalClasses,
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message:
          "Subject ID is required",
      });
    }

    const attendedNumber =
      Number(attended);

    const totalNumber =
      Number(totalClasses);

    if (
      !Number.isFinite(
        attendedNumber
      ) ||
      !Number.isFinite(
        totalNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance must be numbers",
      });
    }

    if (
      attendedNumber < 0 ||
      totalNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance cannot be negative",
      });
    }

    if (
      attendedNumber >
      totalNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Attended classes cannot exceed total classes",
      });
    }

    /*
     * IMPORTANT:
     * Make sure this subject belongs
     * to the logged-in user.
     */

    const subject =
      await Subject.findOne({
        _id: subjectId,
        user: req.user.userId,
      });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message:
          "Subject not found",
      });
    }

    const record =
      await Attendance.findOneAndUpdate(
        {
          user: req.user.userId,
          subject: subjectId,
        },
        {
          user: req.user.userId,
          subject: subjectId,
          attended: attendedNumber,
          totalClasses: totalNumber,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      ).populate(
        "subject",
        "name code credits color"
      );

    const percentage =
      totalNumber > 0
        ? Math.round(
            (attendedNumber /
              totalNumber) *
              100
          )
        : 0;

    res.json({
      success: true,

      message:
        "Attendance saved successfully",

      attendance: {
        _id: record._id,

        subject:
          record.subject,

        attended:
          attendedNumber,

        totalClasses:
          totalNumber,

        percentage,
      },
    });
  } catch (error) {
    console.error(
      "SAVE ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to save attendance",
    });
  }
};

/* =========================================
   DELETE ATTENDANCE
========================================= */

const deleteAttendance = async (
  req,
  res
) => {
  try {
    const record =
      await Attendance.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance record not found",
      });
    }

    res.json({
      success: true,
      message:
        "Attendance deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete attendance",
    });
  }
};

module.exports = {
  getAttendance,
  saveAttendance,
  deleteAttendance,
};