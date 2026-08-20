const GradePrediction = require(
  "../models/GradePrediction"
);

/* =========================================================
   GET ALL PREDICTIONS
========================================================= */

const getPredictions = async (
  req,
  res
) => {
  try {
    const query = {
      user: req.user.userId,
    };

    if (req.query.semester) {
      query.semester = Number(
        req.query.semester
      );
    }

    const predictions =
      await GradePrediction.find(
        query
      ).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      predictions,
    });
  } catch (error) {
    console.error(
      "Get grade predictions error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load grade predictions",
    });
  }
};

/* =========================================================
   SAVE PREDICTION
========================================================= */

const savePrediction = async (
  req,
  res
) => {
  try {
    const {
      semester,
      predictedSGPA,
      totalCredits,
      subjects,
    } = req.body;

    /* VALIDATION */

    if (
      !semester ||
      predictedSGPA === undefined ||
      predictedSGPA === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Semester and predicted SGPA are required",
      });
    }

    const sgpa = Number(
      predictedSGPA
    );

    if (
      Number.isNaN(sgpa) ||
      sgpa < 0 ||
      sgpa > 10
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Predicted SGPA must be between 0 and 10",
      });
    }

    /*
      IMPORTANT:

      Instead of creating duplicate predictions
      every time, update the prediction for
      the same user + semester.
    */

    const prediction =
      await GradePrediction.findOneAndUpdate(
        {
          user: req.user.userId,
          semester: Number(semester),
        },
        {
          user: req.user.userId,
          semester: Number(semester),
          predictedSGPA: sgpa,
          totalCredits:
            Number(totalCredits) || 0,
          subjects:
            Array.isArray(subjects)
              ? subjects
              : [],
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    console.log(
      "SGPA PREDICTION SAVED:",
      prediction
    );

    return res.status(201).json({
      success: true,
      message:
        "SGPA prediction saved successfully",
      prediction,
    });
  } catch (error) {
    console.error(
      "Save grade prediction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save SGPA prediction",
    });
  }
};

/* =========================================================
   DELETE PREDICTION
========================================================= */

const deletePrediction = async (
  req,
  res
) => {
  try {
    const prediction =
      await GradePrediction.findOneAndDelete(
        {
          _id: req.params.id,
          user: req.user.userId,
        }
      );

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message:
          "Prediction not found",
      });
    }

    return res.json({
      success: true,
      message:
        "Prediction deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete prediction error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete prediction",
    });
  }
};

module.exports = {
  getPredictions,
  savePrediction,
  deletePrediction,
};