const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

const router = express.Router();

/*
 * All assignment routes require login
 */
router.use(protect);

/*
 * GET
 * /api/assignments
 */
router.get(
  "/",
  getAssignments
);

/*
 * POST
 * /api/assignments
 */
router.post(
  "/",
  createAssignment
);

/*
 * PUT
 * /api/assignments/:id
 */
router.put(
  "/:id",
  updateAssignment
);

/*
 * DELETE
 * /api/assignments/:id
 */
router.delete(
  "/:id",
  deleteAssignment
);

module.exports = router;