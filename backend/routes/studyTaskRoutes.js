const express = require("express");

const protect =
  require("../middleware/authMiddleware");

const {
  getStudyTasks,
  createStudyTask,
  updateStudyTask,
  deleteStudyTask,
} = require(
  "../controllers/studyTaskController"
);

const router =
  express.Router();

router.use(protect);

router.get(
  "/",
  getStudyTasks
);

router.post(
  "/",
  createStudyTask
);

router.put(
  "/:id",
  updateStudyTask
);

router.delete(
  "/:id",
  deleteStudyTask
);

module.exports = router;