import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  User,
} from "lucide-react";

const navigation = [
  {
    label: "Home",
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
    label: "Profile",
    path: "/profile",
    icon: User,
  },
];

export default function MobileNavigation() {
  return (
    <nav className="cf-mobile-nav">
      {navigation.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `cf-mobile-nav-item ${isActive ? "active" : ""}`
          }
        >
          <Icon size={21} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}