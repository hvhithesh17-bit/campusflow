const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const router = express.Router();

router.use(protect);

router.get("/", getSubjects);

router.post("/", createSubject);

router.put("/:id", updateSubject);

router.delete("/:id", deleteSubject);

module.exports = router;