// src/components/Sidebar.jsx

import React, { useMemo } from "react";
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
  Menu,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const NAV_ITEMS = [
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
    label: "Study Planner",
    shortLabel: "Planner",
    icon: CalendarDays,
  },
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
  {
    id: "ai-assistant",
    path: "/ai-assistant",
    label: "AI Assistant",
    shortLabel: "AI",
    icon: Bot,
  },
  {
    id: "profile",
    path: "/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: User,
  },
];

const MOBILE_PRIMARY_IDS = [
  "dashboard",
  "subjects",
  "studyPlanner",
  "assignments",
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

  const activeItem = useMemo(() => {
    return (
      NAV_ITEMS.find((item) => location.pathname === item.path) ||
      NAV_ITEMS.find((item) => currentPage === item.id) ||
      NAV_ITEMS[0]
    );
  }, [location.pathname, currentPage]);

  const mobilePrimaryItems = NAV_ITEMS.filter((item) =>
    MOBILE_PRIMARY_IDS.includes(item.id)
  );

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
      await logout();
      setCurrentPage?.("login");
      closeMobileMenu();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const isItemActive = (item) => {
    if (location.pathname === item.path) return true;

    // Keep nested routes active, but don't make "/" accidentally active.
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
          MOBILE TOP BAR
      ===================================================== */}
      <header className="cf-sidebar-mobile-header">
        <button
          type="button"
          className="cf-sidebar-icon-button"
          onClick={() => setIsOpen?.(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <button
          type="button"
          className="cf-sidebar-mobile-brand"
          onClick={() => handleNavigation(NAV_ITEMS[0])}
          aria-label="Go to Dashboard"
        >
          <span className="cf-sidebar-brand-mark">C</span>
          <span className="cf-sidebar-mobile-title">CampusFlow</span>
        </button>

        <button
          type="button"
          className="cf-sidebar-mobile-profile"
          onClick={() => handleNavigation(NAV_ITEMS[NAV_ITEMS.length - 1])}
          aria-label="Open profile"
        >
          <User size={19} />
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      <button
        type="button"
        className={`cf-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
        onClick={closeMobileMenu}
        aria-label="Close navigation"
        tabIndex={isOpen ? 0 : -1}
      />

      {/* =====================================================
          DESKTOP SIDEBAR / MOBILE DRAWER
      ===================================================== */}
      <aside
        className={`cf-sidebar ${isOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="cf-sidebar-header">
          <button
            type="button"
            className="cf-sidebar-brand"
            onClick={() => handleNavigation(NAV_ITEMS[0])}
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
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="cf-sidebar-current">
          <span className="cf-sidebar-current-dot" />
          <span>Student workspace</span>
        </div>

        <nav className="cf-sidebar-nav">
          <p className="cf-sidebar-section-label">MAIN</p>

          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <button
                key={item.id}
                type="button"
                className={`cf-sidebar-nav-item ${
                  active ? "is-active" : ""
                }`}
                onClick={() => handleNavigation(item)}
                aria-current={active ? "page" : undefined}
              >
                <span className="cf-sidebar-nav-icon">
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
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
            TOOLS
          </p>

          {NAV_ITEMS.slice(5, 8).map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <button
                key={item.id}
                type="button"
                className={`cf-sidebar-nav-item ${
                  active ? "is-active" : ""
                }`}
                onClick={() => handleNavigation(item)}
                aria-current={active ? "page" : undefined}
              >
                <span className="cf-sidebar-nav-icon">
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
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

          {NAV_ITEMS.slice(8).map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <button
                key={item.id}
                type="button"
                className={`cf-sidebar-nav-item ${
                  active ? "is-active" : ""
                }`}
                onClick={() => handleNavigation(item)}
                aria-current={active ? "page" : undefined}
              >
                <span className="cf-sidebar-nav-icon">
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
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

        <div className="cf-sidebar-footer">
          <button
            type="button"
            className="cf-sidebar-logout"
            onClick={handleLogout}
          >
            <span className="cf-sidebar-nav-icon">
              <LogOut size={19} />
            </span>
            <span>Logout</span>
          </button>

          <div className="cf-sidebar-version">
            <span>CampusFlow</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ===================================================== */}
      <nav className="cf-mobile-bottom-nav" aria-label="Mobile navigation">
        {mobilePrimaryItems.map((item) => {
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
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span>{item.shortLabel}</span>
            </button>
          );
        })}

        <button
          type="button"
          className={`cf-mobile-nav-item ${
            isOpen ? "is-active" : ""
          }`}
          onClick={() => setIsOpen?.(!isOpen)}
          aria-label="Open more navigation options"
          aria-expanded={isOpen}
        >
          <span className="cf-mobile-nav-icon">
            <MoreHorizontal size={21} />
          </span>
          <span>More</span>
        </button>
      </nav>

      {/* =====================================================
          MOBILE SPACERS
          Prevent fixed navigation from covering page content.
      ===================================================== */}
      <div className="cf-mobile-top-spacer" aria-hidden="true" />
      <div className="cf-mobile-bottom-spacer" aria-hidden="true" />

      {/* =====================================================
          ACTIVE PAGE ANNOUNCEMENT FOR SCREEN READERS
      ===================================================== */}
      <span className="sr-only" aria-live="polite">
        {activeItem.label}
      </span>
    </>
  );
};

export default Sidebar;