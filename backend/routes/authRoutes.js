const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

router.get(
  "/me",
  authMiddleware,
  getMe
);

router.put(
  "/change-password",
  authMiddleware,
  changePassword
);

module.exports = router;