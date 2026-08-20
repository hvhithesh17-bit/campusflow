import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Calculator,
  BookMarked,
  User,
  Settings,
  LogOut,
  Clock,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Subjects",
    path: "/subjects",
    icon: BookOpen,
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Assignments",
    path: "/assignments",
    icon: ClipboardList,
  },
  {
    label: "Timetable",
    path: "/timetable",
    icon: Clock,
  },
  {
    label: "SGPA / CGPA",
    path: "/sgpa",
    icon: Calculator,
  },
  {
    label: "Study Planner",
    path: "/studyplanner",
    icon: BookMarked,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="cf-sidebar">

      {/* Brand */}

      <div className="cf-sidebar-brand">

        <div className="cf-logo">
          C
        </div>

        <div>
          <div className="cf-brand-name">
            CampusFlow
          </div>

          <div className="cf-brand-subtitle">
            Student Hub
          </div>
        </div>

      </div>

      {/* Navigation */}

      <nav className="cf-sidebar-nav">

        <div className="cf-nav-label">
          MAIN
        </div>

        {navigation.map(
          ({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `cf-nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon
                size={20}
                strokeWidth={2}
              />

              <span>{label}</span>
            </NavLink>
          )
        )}

      </nav>

      {/* Bottom */}

      <div className="cf-sidebar-bottom">

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `cf-nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `cf-nav-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>

        <button
          type="button"
          className="cf-nav-item cf-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        {user && (
          <div className="cf-sidebar-user">

            <div className="cf-sidebar-avatar">
              {user.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="cf-sidebar-user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

          </div>
        )}

      </div>

    </aside>
  );
}