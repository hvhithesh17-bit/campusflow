const Subject = require("../models/Subject");

// GET all subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({
      user: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error(
      "Get subjects error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to load subjects",
    });
  }
};

// CREATE subject
const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      credits,
      faculty,
      color,
    } = req.body;

    if (!name || credits === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Subject name and credits are required",
      });
    }

    const subject = await Subject.create({
      user: req.user.userId,
      name: name.trim(),
      code: code?.trim() || "",
      credits: Number(credits),
      faculty: faculty?.trim() || "",
      color: color || "#2563eb",
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    console.error(
      "Create subject error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to create subject",
    });
  }
};

// UPDATE subject
const updateSubject = async (req, res) => {
  try {
    const subject =
      await Subject.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.userId,
        },
        {
          ...req.body,
          credits:
            req.body.credits !== undefined
              ? Number(req.body.credits)
              : undefined,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error(
      "Update subject error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to update subject",
    });
  }
};

// DELETE subject
const deleteSubject = async (req, res) => {
  try {
    const subject =
      await Subject.findOneAndDelete({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete subject error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to delete subject",
    });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};