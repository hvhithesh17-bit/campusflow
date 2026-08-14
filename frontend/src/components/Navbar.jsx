// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Subjects", path: "/subjects" },
    { label: "Attendance", path: "/attendance" },
    { label: "Assignments", path: "/assignments" },
    { label: "Study Planner", path: "/studyPlanner" },
    { label: "SGPA Calculator", path: "/sgpa" },
    { label: "Profile", path: "/profile" },
    { name: "Analytics", path: "/analytics", icon: BarChart2 },
  ];

  return (
    <aside
      className={`sidebar ${isOpen ? "open" : ""}`}
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        color: "#fff",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>CampusFlow</h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen && setIsOpen(false)}
            style={({ isActive }) => ({
              display: "block",
              padding: "10px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              color: isActive ? "#ffffff" : "#94a3b8",
              backgroundColor: isActive ? "#334155" : "transparent",
              fontWeight: isActive ? "600" : "400",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}