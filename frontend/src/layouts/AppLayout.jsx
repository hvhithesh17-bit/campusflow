import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/navigation/Sidebar";
import MobileNavigation from "../components/navigation/MobileNavigation";
import Header from "../components/navigation/Header";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="cf-app">

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="cf-mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`cf-mobile-drawer ${
          mobileMenuOpen ? "open" : ""
        }`}
      >
        <Sidebar />
      </div>

      {/* Main */}
      <div className="cf-main">

        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="cf-content">
          <Outlet />
        </main>

      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />

    </div>
  );
}