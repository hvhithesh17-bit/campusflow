import React from 'react';
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
  BarChart2 // <-- Added missing import
} from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // List of navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'studyPlanner', label: 'Study Planner', icon: CalendarDays },
    { id: 'sgpa', label: 'SGPA Calculator', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavigation = (id) => {
    navigate(`/${id}`);
    if (setCurrentPage) {
      setCurrentPage(id);
    }
    if (setIsOpen) {
      setIsOpen(false); // Close on mobile after click
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40
          }}
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.3s ease'
        }}
      >
        {/* Logo area */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>CampusFlow</h2>
          <button 
            className="btn" 
            style={{ padding: '0.25rem', display: 'block', background: 'transparent' }}
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <X size={20} className="close-icon" style={{ display: 'none' }} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === `/${item.id}` || currentPage === item.id;
              
              return (
                <li key={item.id} style={{ margin: '0.25rem 1rem' }}>
                  <button
                    onClick={() => handleNavigation(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 500,
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout area at bottom */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--danger-color)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .close-icon { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;