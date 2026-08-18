// src/components/Sidebar.jsx
import React, { useMemo, useEffect } from "react";
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
  MoreHorizontal,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const NAV_MAIN_ITEMS = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
  },
  {
    id: "subjects",
    path: "/subjects",
    label: "Subjects",
    shortLabel: "Subjects",
    icon: BookOpen,
  },
  {
    id: "attendance",
    path: "/attendance",
    label: "Attendance",
    shortLabel: "Attendance",
    icon: CalendarCheck,
  },
  {
    id: "assignments",
    path: "/assignments",
    label: "Assignments",
    shortLabel: "Tasks",
    icon: ClipboardList,
  },
  {
    id: "studyPlanner",
    path: "/study-planner",
    aliases: ["/study-planner", "/planner", "/studyplanner"],
    label: "Study Planner",
    shortLabel: "Planner",
    icon: CalendarDays,
  },
];

const NAV_TOOL_ITEMS = [
  {
    id: "sgpa",
    path: "/sgpa",
    label: "SGPA Calculator",
    shortLabel: "SGPA",
    icon: Calculator,
  },
  {
    id: "analytics",
    path: "/analytics",
    label: "Analytics",
    shortLabel: "Analytics",
    icon: BarChart2,
  },
];

const NAV_ACCOUNT_ITEMS = [
  {
    id: "profile",
    path: "/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: User,
  },
];

const ALL_NAV_ITEMS = [
  ...NAV_MAIN_ITEMS,
  ...NAV_TOOL_ITEMS,
  ...NAV_ACCOUNT_ITEMS,
];

const MOBILE_BOTTOM_PRIMARY_ITEMS = [
  NAV_MAIN_ITEMS[0], // Dashboard
  NAV_MAIN_ITEMS[1], // Subjects
  NAV_MAIN_ITEMS[2], // Attendance
  NAV_MAIN_ITEMS[3], // Assignments
];

const Sidebar = ({
  currentPage,
  setCurrentPage,
  isOpen = false,
  setIsOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen?.(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activeItem = useMemo(() => {
    return (
      ALL_NAV_ITEMS.find((item) => {
        if (location.pathname === item.path) return true;
        if (item.aliases && item.aliases.includes(location.pathname)) return true;
        return false;
      }) ||
      ALL_NAV_ITEMS.find((item) => currentPage === item.id) ||
      ALL_NAV_ITEMS[0]
    );
  }, [location.pathname, currentPage]);

  const closeMobileMenu = () => {
    setIsOpen?.(false);
  };

  const handleNavigation = (item) => {
    navigate(item.path);
    setCurrentPage?.(item.id);
    closeMobileMenu();
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      setCurrentPage?.("login");
      closeMobileMenu();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const isItemActive = (item) => {
    if (location.pathname === item.path) return true;
    if (item.aliases && item.aliases.includes(location.pathname)) return true;

    // Keep nested paths active
    if (
      item.path !== "/dashboard" &&
      location.pathname.startsWith(`${item.path}/`)
    ) {
      return true;
    }

    return currentPage === item.id && !location.pathname.startsWith("/login");
  };

  return (
    <>
      {/* =====================================================
          MOBILE DRAWER BACKDROP OVERLAY
      ===================================================== */}
      <div
        className={`cf-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden={!isOpen}
      />

      {/* =====================================================
          DESKTOP SIDEBAR / MOBILE DRAWER
      ===================================================== */}
      <aside
        className={`cf-sidebar ${isOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        {/* Brand Header */}
        <div className="cf-sidebar-header">
          <button
            type="button"
            className="cf-sidebar-brand"
            onClick={() => handleNavigation(NAV_MAIN_ITEMS[0])}
          >
            <span className="cf-sidebar-brand-mark">C</span>

            <span className="cf-sidebar-brand-copy">
              <strong>CampusFlow</strong>
              <small>Academic Hub</small>
            </span>
          </button>

          <button
            type="button"
            className="cf-sidebar-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Workspace Pill */}
        <div className="cf-sidebar-current">
          <span className="cf-sidebar-current-dot" />
          <span>Student Workspace</span>
        </div>

        {/* Navigation Sections */}
        <nav className="cf-sidebar-nav">
          <p className="cf-sidebar-section-label">MAIN</p>
          {NAV_MAIN_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <button
                key={item.id}
                type="button"
                className={`cf-sidebar-nav-item ${active ? "is-active" : ""}`}
                onClick={() => handleNavigation(item)}
                aria-current={active ? "page" : undefined}
              >
                <span className="cf-sidebar-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                </span>

                <span className="cf-sidebar-nav-label">
                  {item.label}
                </span>

                {active && (
                  <span className="cf-sidebar-active-line" />
                )}
              </button>
            );
          })}

          <p className="cf-sidebar-section-label cf-sidebar-section-spaced">
            TOOLS & ANALYTICS
          </p>
          {NAV_TOOL_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <button
                key={item.id}
                type="button"
                className={`cf-sidebar-nav-item ${active ? "is-active" : ""}`}
                onClick={() => handleNavigation(item)}
                aria-current={active ? "page" : undefined}
              >
                <span className="cf-sidebar-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                </span>

                <span className="cf-sidebar-nav-label">
                  {item.label}
                </span>

                {active && (
                  <span className="cf-sidebar-active-line" />
                )}
              </button>
            );
          })}

          <p className="cf-sidebar-section-label cf-sidebar-section-spaced">
            ACCOUNT
          </p>
          {NAV_ACCOUNT_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <button
                key={item.id}
                type="button"
                className={`cf-sidebar-nav-item ${active ? "is-active" : ""}`}
                onClick={() => handleNavigation(item)}
                aria-current={active ? "page" : undefined}
              >
                <span className="cf-sidebar-nav-icon">
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                </span>

                <span className="cf-sidebar-nav-label">
                  {item.label}
                </span>

                {active && (
                  <span className="cf-sidebar-active-line" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="cf-sidebar-footer">
          <button
            type="button"
            className="cf-sidebar-logout"
            onClick={handleLogout}
          >
            <span className="cf-sidebar-nav-icon">
              <LogOut size={18} />
            </span>
            <span>Sign Out</span>
          </button>

          <div className="cf-sidebar-version">
            <span>CampusFlow Hub</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION (Fixed at bottom on screens <= 768px)
      ===================================================== */}
      <nav className="cf-mobile-bottom-nav" aria-label="Mobile Navigation">
        {MOBILE_BOTTOM_PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <button
              key={item.id}
              type="button"
              className={`cf-mobile-nav-item ${active ? "is-active" : ""}`}
              onClick={() => handleNavigation(item)}
              aria-current={active ? "page" : undefined}
            >
              <span className="cf-mobile-nav-icon">
                <Icon size={19} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span>{item.shortLabel}</span>
            </button>
          );
        })}

        {/* More options button (opens full sidebar drawer) */}
        <button
          type="button"
          className={`cf-mobile-nav-item ${isOpen ? "is-active" : ""}`}
          onClick={() => setIsOpen?.(!isOpen)}
          aria-label="More navigation options"
          aria-expanded={isOpen}
        >
          <span className="cf-mobile-nav-icon">
            <MoreHorizontal size={20} />
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* Screen Reader Announcement */}
      <span className="sr-only" aria-live="polite">
        {activeItem.label}
      </span>
    </>
  );
};

export default Sidebar;