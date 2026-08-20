const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} = require("../controllers/timetableController");

const router = express.Router();

console.log("✅ Timetable routes loaded");

// Apply authentication middleware to all timetable routes
router.use(protect);

/* =========================================
   TIMETABLE ROUTES
========================================= */

router.get("/", getTimetable);
router.post("/", createTimetable);
router.put("/:id", updateTimetable);
router.delete("/:id", deleteTimetable);

module.exports = router;