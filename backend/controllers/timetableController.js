const Timetable = require("../models/Timetable");
const Subject = require("../models/Subject");

/* =========================================================
   GET TIMETABLE
========================================================= */

const getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.find({
      user: req.user.userId,
    })
      .populate(
        "subject",
        "name code credits"
      )
      .sort({
        day: 1,
        startTime: 1,
      });

    res.json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error(
      "GET TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load timetable",
    });
  }
};

/* =========================================================
   CREATE TIMETABLE ENTRY
========================================================= */

const createTimetable = async (req, res) => {
  try {
    const {
      subjectId,
      day,
      startTime,
      endTime,
      room,
      faculty,
    } = req.body;

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject is required",
      });
    }

    if (!day) {
      return res.status(400).json({
        success: false,
        message: "Day is required",
      });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start and end time are required",
      });
    }

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    /* -----------------------------------------
       CHECK SUBJECT OWNERSHIP
    ----------------------------------------- */

    const subject = await Subject.findOne({
      _id: subjectId,
      user: req.user.userId,
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    /* -----------------------------------------
       CREATE
    ----------------------------------------- */

    const timetable =
      await Timetable.create({
        user: req.user.userId,

        subject: subjectId,

        day,

        startTime,

        endTime,

        room:
          room?.trim() || "",

        faculty:
          faculty?.trim() || "",
      });

    /* -----------------------------------------
       POPULATE
    ----------------------------------------- */

    const populated =
      await Timetable.findById(
        timetable._id
      ).populate(
        "subject",
        "name code credits"
      );

    res.status(201).json({
      success: true,

      message:
        "Timetable entry created successfully",

      timetable: populated,
    });
  } catch (error) {
    console.error(
      "CREATE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create timetable entry",
    });
  }
};

/* =========================================================
   UPDATE TIMETABLE ENTRY
========================================================= */

const updateTimetable = async (
  req,
  res
) => {
  try {
    const {
      subjectId,
      day,
      startTime,
      endTime,
      room,
      faculty,
    } = req.body;

    const timetable =
      await Timetable.findOne({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message:
          "Timetable entry not found",
      });
    }

    /* -----------------------------------------
       SUBJECT
    ----------------------------------------- */

    if (subjectId) {
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

      timetable.subject =
        subjectId;
    }

    /* -----------------------------------------
       DAY
    ----------------------------------------- */

    if (day !== undefined) {
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      if (!validDays.includes(day)) {
        return res.status(400).json({
          success: false,
          message: "Invalid day",
        });
      }

      timetable.day = day;
    }

    /* -----------------------------------------
       TIME
    ----------------------------------------- */

    if (startTime !== undefined) {
      timetable.startTime =
        startTime;
    }

    if (endTime !== undefined) {
      timetable.endTime =
        endTime;
    }

    /* -----------------------------------------
       OTHER FIELDS
    ----------------------------------------- */

    if (room !== undefined) {
      timetable.room =
        room.trim();
    }

    if (faculty !== undefined) {
      timetable.faculty =
        faculty.trim();
    }

    await timetable.save();

    const updated =
      await Timetable.findById(
        timetable._id
      ).populate(
        "subject",
        "name code credits"
      );

    res.json({
      success: true,

      message:
        "Timetable entry updated successfully",

      timetable: updated,
    });
  } catch (error) {
    console.error(
      "UPDATE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update timetable entry",
    });
  }
};

/* =========================================================
   DELETE TIMETABLE ENTRY
========================================================= */

const deleteTimetable = async (
  req,
  res
) => {
  try {
    const timetable =
      await Timetable.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message:
          "Timetable entry not found",
      });
    }

    res.json({
      success: true,
      message:
        "Timetable entry deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete timetable entry",
    });
  }
};

module.exports = {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
};