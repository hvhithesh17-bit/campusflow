const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getAttendance,
  saveAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

/*
 * Every attendance endpoint requires login
 */
router.use(protect);

/*
 * GET
 * /api/attendance
 */
router.get(
  "/",
  getAttendance
);

/*
 * POST
 * /api/attendance
 */
router.post(
  "/",
  saveAttendance
);

/*
 * DELETE
 * /api/attendance/:id
 */
router.delete(
  "/:id",
  deleteAttendance
);

module.exports = router;