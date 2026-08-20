const Assignment = require("../models/Assignment");
const Subject = require("../models/Subject");

/* =========================================
   GET ALL ASSIGNMENTS
========================================= */

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      user: req.user.userId,
    })
      .populate(
        "subject",
        "name code credits"
      )
      .sort({
        dueDate: 1,
        createdAt: -1,
      });

    res.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error(
      "GET ASSIGNMENTS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load assignments",
    });
  }
};

/* =========================================
   CREATE ASSIGNMENT
========================================= */

const createAssignment = async (req, res) => {
  try {
    const {
      subjectId,
      title,
      description,
      dueDate,
      priority,
    } = req.body;

    /* -------------------------------
       VALIDATION
    -------------------------------- */

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject is required",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Assignment title is required",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Due date is required",
      });
    }

    /* -------------------------------
       CHECK SUBJECT OWNERSHIP
    -------------------------------- */

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

    /* -------------------------------
       CREATE ASSIGNMENT
    -------------------------------- */

    const assignment =
      await Assignment.create({
        user: req.user.userId,

        subject: subjectId,

        title: title.trim(),

        description:
          description?.trim() || "",

        dueDate: new Date(dueDate),

        priority:
          priority || "medium",

        status: "pending",
      });

    /* -------------------------------
       RETURN POPULATED DATA
    -------------------------------- */

    const populatedAssignment =
      await Assignment.findById(
        assignment._id
      ).populate(
        "subject",
        "name code credits"
      );

    res.status(201).json({
      success: true,

      message:
        "Assignment created successfully",

      assignment:
        populatedAssignment,
    });
  } catch (error) {
    console.error(
      "CREATE ASSIGNMENT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to create assignment",
    });
  }
};

/* =========================================
   UPDATE ASSIGNMENT
========================================= */

const updateAssignment = async (
  req,
  res
) => {
  try {
    const {
      subjectId,
      title,
      description,
      dueDate,
      priority,
      status,
    } = req.body;

    const assignment =
      await Assignment.findOne({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found",
      });
    }

    /* -------------------------------
       SUBJECT
    -------------------------------- */

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

      assignment.subject =
        subjectId;
    }

    /* -------------------------------
       OTHER FIELDS
    -------------------------------- */

    if (
      title !== undefined
    ) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Assignment title cannot be empty",
        });
      }

      assignment.title =
        title.trim();
    }

    if (
      description !== undefined
    ) {
      assignment.description =
        description.trim();
    }

    if (dueDate !== undefined) {
      assignment.dueDate =
        new Date(dueDate);
    }

    if (priority !== undefined) {
      assignment.priority =
        priority;
    }

    if (status !== undefined) {
      assignment.status =
        status;
    }

    await assignment.save();

    const updatedAssignment =
      await Assignment.findById(
        assignment._id
      ).populate(
        "subject",
        "name code credits"
      );

    res.json({
      success: true,

      message:
        "Assignment updated successfully",

      assignment:
        updatedAssignment,
    });
  } catch (error) {
    console.error(
      "UPDATE ASSIGNMENT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to update assignment",
    });
  }
};

/* =========================================
   DELETE ASSIGNMENT
========================================= */

const deleteAssignment = async (
  req,
  res
) => {
  try {
    const assignment =
      await Assignment.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "Assignment not found",
      });
    }

    res.json({
      success: true,

      message:
        "Assignment deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE ASSIGNMENT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete assignment",
    });
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};