const express = require("express");

const protect = require(
  "../middleware/authMiddleware"
);

const {
  getPredictions,
  savePrediction,
  deletePrediction,
} = require(
  "../controllers/gradePredictionController"
);

const router = express.Router();

/* All routes require login */

router.use(protect);

/* GET predictions */

router.get(
  "/",
  getPredictions
);

/* SAVE prediction */

router.post(
  "/",
  savePrediction
);

/* DELETE prediction */

router.delete(
  "/:id",
  deletePrediction
);

module.exports = router;