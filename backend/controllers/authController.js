const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// REGISTER
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      college,
      branch,
      semester,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      college: college?.trim() || "",
      branch: branch?.trim() || "",
      semester: Number(semester) || 1,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error while creating account",
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error while logging in",
    });
  }
};

// CURRENT USER
const getMe = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
      },
    });
  } catch (error) {
    console.error(
      "Get user error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters.",
      });
    }

    const user = await User.findById(
      req.user.userId
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password =
      hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to change password.",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};