// src/App.jsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Authentication Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Application Pages
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Attendance from "./pages/Attendance";
import Assignments from "./pages/Assignments";
import Sgpa from "./pages/Sgpa";
import StudyPlanner from "./pages/StudyPlanner";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";

// Layout Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPage = location.pathname.replace("/", "") || "dashboard";

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="main-content">
        <Header
          pageTitle={currentPage}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/assignments" element={<Assignments />} />

            {/* Study Planner Primary and Alias Route Mappings */}
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/studyplanner" element={<StudyPlanner />} />

            <Route path="/sgpa" element={<Sgpa />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all Fallback Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;