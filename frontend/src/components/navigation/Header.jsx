import { Bell, Menu } from "lucide-react";

export default function Header({ onMenuClick }) {
  return (
    <header className="cf-header">
      <div className="cf-header-left">
        <button
          type="button"
          className="cf-mobile-menu"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="cf-header-title">CampusFlow</div>
          <div className="cf-header-subtitle">
            Your academic companion
          </div>
        </div>
      </div>

      <button
        type="button"
        className="cf-notification-button"
        aria-label="Notifications"
      >
        <Bell size={21} />
        <span className="cf-notification-dot" />
      </button>
    </header>
  );
}