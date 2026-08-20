require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const studyTaskRoutes = require("./routes/studyTaskRoutes");
const gradePredictionRoutes = require("./routes/gradePredictionRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

/* =========================================
   DATABASE
========================================= */

connectDB();

/* =========================================
   MIDDLEWARE
========================================= */

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

/* =========================================
   TEST ROUTES
========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CampusFlow API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CampusFlow backend is healthy",
  });
});

/* =========================================
   API ROUTES
========================================= */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/subjects",
  subjectRoutes
);

app.use(
  "/api/attendance",
  attendanceRoutes
);

app.use(
  "/api/assignments",
  assignmentRoutes
);

app.use(
  "/api/timetable",
  timetableRoutes
);

app.use(
  "/api/study-tasks",
  studyTaskRoutes
);

app.use(
  "/api/grade-predictions",
  gradePredictionRoutes
);

/* =========================================
   DIRECT TIMETABLE TEST
========================================= */

app.get("/api/timetable", (req, res) => {
  console.log("🔥 TIMETABLE TEST ROUTE HIT");

  res.json({
    success: true,
    message: "Timetable route is working directly from server.js",
  });
});

/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {
  console.log(
    `404 - ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    endpoint: req.originalUrl,
  });
});

/* =========================================
   SERVER
========================================= */

app.listen(PORT, () => {
  console.log(
    `CampusFlow API running on http://localhost:${PORT}`
  );
});