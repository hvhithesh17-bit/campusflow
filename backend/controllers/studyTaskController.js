const StudyTask = require("../models/StudyTask");
const Subject = require("../models/Subject");

/* =========================================================
   GET ALL STUDY TASKS
========================================================= */

const getStudyTasks = async (req, res) => {
  try {
    const tasks =
      await StudyTask.find({
        user: req.user.userId,
      })
        .populate(
          "subject",
          "name code credits faculty color"
        )
        .sort({
          date: 1,
          startTime: 1,
        });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get study tasks error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to load study tasks",
    });
  }
};

/* =========================================================
   CREATE STUDY TASK
========================================================= */

const createStudyTask = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      topic,
      date,
      startTime,
      endTime,
      priority,
    } = req.body;

    if (
      !title ||
      !subjectId ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, subject, date, start time and end time are required",
      });
    }

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

    if (
      priority &&
      !["High", "Medium", "Low"].includes(
        priority
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid priority",
      });
    }

    const task =
      await StudyTask.create({
        user: req.user.userId,
        subject: subject._id,
        title: title.trim(),
        topic: topic?.trim() || "",
        date,
        startTime,
        endTime,
        priority: priority || "Medium",
        completed: false,
      });

    const populatedTask =
      await task.populate(
        "subject",
        "name code credits faculty color"
      );

    res.status(201).json({
      success: true,
      message:
        "Study task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error(
      "Create study task error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create study task",
    });
  }
};

/* =========================================================
   UPDATE STUDY TASK
========================================================= */

const updateStudyTask = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      topic,
      date,
      startTime,
      endTime,
      priority,
      completed,
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
      updateData.title =
        title.trim();
    }

    if (topic !== undefined) {
      updateData.topic =
        topic.trim();
    }

    if (date !== undefined) {
      updateData.date = date;
    }

    if (startTime !== undefined) {
      updateData.startTime =
        startTime;
    }

    if (endTime !== undefined) {
      updateData.endTime =
        endTime;
    }

    if (priority !== undefined) {
      if (
        !["High", "Medium", "Low"].includes(
          priority
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid priority",
        });
      }

      updateData.priority =
        priority;
    }

    if (completed !== undefined) {
      updateData.completed =
        Boolean(completed);
    }

    if (subjectId !== undefined) {
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

      updateData.subject =
        subject._id;
    }

    const task =
      await StudyTask.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.userId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "subject",
        "name code credits faculty color"
      );

    if (!task) {
      return res.status(404).json({
        success: false,
        message:
          "Study task not found",
      });
    }

    res.json({
      success: true,
      message:
        "Study task updated successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Update study task error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update study task",
    });
  }
};

/* =========================================================
   DELETE STUDY TASK
========================================================= */

const deleteStudyTask = async (req, res) => {
  try {
    const task =
      await StudyTask.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message:
          "Study task not found",
      });
    }

    res.json({
      success: true,
      message:
        "Study task deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete study task error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete study task",
    });
  }
};

module.exports = {
  getStudyTasks,
  createStudyTask,
  updateStudyTask,
  deleteStudyTask,
};