// src/components/Sidebar.jsx

import React from "react";

import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CalendarDays,
  Calculator,
  User,
  LogOut,
  X,
  BarChart2,
  Bot,
} from "lucide-react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Sidebar = ({
  currentPage,
  setCurrentPage,
  isOpen,
  setIsOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { logout } = useAuth();

  // ============================================================
  // NAVIGATION ITEMS
  // ============================================================

  const navItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      id: "subjects",
      path: "/subjects",
      label: "Subjects",
      icon: BookOpen,
    },

    {
      id: "attendance",
      path: "/attendance",
      label: "Attendance",
      icon: CalendarCheck,
    },

    {
      id: "assignments",
      path: "/assignments",
      label: "Assignments",
      icon: ClipboardList,
    },

    // IMPORTANT:
    // This must be /study-planner
    // because StudyPlanner.jsx uses this route.
    {
      id: "studyPlanner",
      path: "/study-planner",
      label: "Study Planner",
      icon: CalendarDays,
    },

    {
      id: "sgpa",
      path: "/sgpa",
      label: "SGPA Calculator",
      icon: Calculator,
    },

    {
      id: "analytics",
      path: "/analytics",
      label: "Analytics",
      icon: BarChart2,
    },

    {
      id: "ai-assistant",
      path: "/ai-assistant",
      label: "AI Assistant",
      icon: Bot,
    },

    {
      id: "profile",
      path: "/profile",
      label: "Profile",
      icon: User,
    },
  ];

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigation = (item) => {
    navigate(item.path);

    if (setCurrentPage) {
      setCurrentPage(item.id);
    }

    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      await logout();

      navigate("/login");

      if (setCurrentPage) {
        setCurrentPage("login");
      }

      if (setIsOpen) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // ============================================================
  // ACTIVE ROUTE
  // ============================================================

  const isItemActive = (item) => {
    // Exact match
    if (location.pathname === item.path) {
      return true;
    }

    // Current page fallback
    if (
      currentPage === item.id &&
      !location.pathname.startsWith("/login")
    ) {
      return true;
    }

    return false;
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {isOpen && (
        <div
          onClick={() => {
            if (setIsOpen) {
              setIsOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`sidebar ${
          isOpen ? "open" : ""
        }`}
        style={{
          width: "var(--sidebar-width)",
          backgroundColor:
            "var(--bg-secondary)",
          borderRight:
            "1px solid var(--border-color)",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transition:
            "transform 0.3s ease",
        }}
      >
        {/* ==================================================
            LOGO / HEADER
        ================================================== */}

        <div
          style={{
            padding: "1.5rem",
            borderBottom:
              "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "var(--accent-color)",
            }}
          >
            CampusFlow
          </h2>

          <button
            type="button"
            className="btn"
            aria-label="Close sidebar"
            style={{
              padding: "0.25rem",
              display: "block",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              if (setIsOpen) {
                setIsOpen(false);
              }
            }}
          >
            <X
              size={20}
              className="close-icon"
              style={{
                display: "none",
              }}
            />
          </button>
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav
          style={{
            flex: 1,
            padding: "1rem 0",
            overflowY: "auto",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                isItemActive(item);

              return (
                <li
                  key={item.id}
                  style={{
                    margin:
                      "0.25rem 1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleNavigation(item)
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding:
                        "0.75rem 1rem",
                      borderRadius: "8px",
                      border: "none",

                      backgroundColor:
                        isActive
                          ? "var(--accent-color)"
                          : "transparent",

                      color: isActive
                        ? "white"
                        : "var(--text-secondary)",

                      cursor: "pointer",

                      fontWeight: isActive
                        ? 600
                        : 500,

                      textAlign: "left",

                      transition:
                        "all 0.2s ease",
                    }}
                  >
                    <Icon size={20} />

                    <span>
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ==================================================
            LOGOUT
        ================================================== */}

        <div
          style={{
            padding: "1rem",
            borderTop:
              "1px solid var(--border-color)",
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding:
                "0.75rem 1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor:
                "transparent",
              color:
                "var(--danger-color)",
              cursor: "pointer",
              fontWeight: 500,
              textAlign: "left",
            }}
          >
            <LogOut size={20} />

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ======================================================
          MOBILE CSS
      ====================================================== */}

      <style>
        {`
          @media (max-width: 768px) {
            .close-icon {
              display: block !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;