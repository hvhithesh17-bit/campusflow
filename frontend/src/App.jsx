import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import AppLayout from "./layouts/AppLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Subjects from "./pages/subjects/Subjects";
import Attendance from "./pages/attendance/Attendance";
import Assignments from "./pages/assignments/Assignments";
import Timetable from "./pages/timetable/Timetable";
import SGPA from "./pages/sgpa/SGPA";
import StudyPlanner from "./pages/studyplanner/StudyPlanner";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";

import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";

import "./App.css";

function Placeholder({ title }) {
  return (
    <div className="page-placeholder">
      <div className="page-placeholder-icon">
        C
      </div>

      <h1>{title}</h1>

      <p>
        This page will be built in a later step.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* =====================================
              GUEST ROUTES
          ====================================== */}

          <Route element={<GuestRoute />}>

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

          </Route>

          {/* =====================================
              PROTECTED APP
          ====================================== */}

          <Route element={<ProtectedRoute />}>

            <Route element={<AppLayout />}>

              <Route
                path="/dashboard"
                element={<Dashboard />}
               />

              <Route
                path="/subjects"
                element={<Subjects />}
              />

              <Route
                path="/attendance"
                element={<Attendance />}
              />

              <Route
                path="/assignments"
                element={<Assignments />}
              />

              <Route
                path="/timetable"
                element={<Timetable />}
              />

              <Route
                path="/sgpa"
                element={<SGPA />}
              />

              <Route
                path="/studyplanner"
                element={<StudyPlanner />}
              />

              
              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

            </Route>

          </Route>

          {/* =====================================
              DEFAULT ROUTE
          ====================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}