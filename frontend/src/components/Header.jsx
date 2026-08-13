import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

const Header = ({ onMenuClick, pageTitle }) => {
  return (
    <header style={{
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={onMenuClick}
          className="btn-outline flex-center mobile-menu-btn"
          style={{ padding: '0.5rem', display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <h2 style={{ margin: 0, textTransform: 'capitalize' }}>
          {/* Format page title to look nice (e.g. "studyPlanner" -> "Study Planner") */}
          {pageTitle.replace(/([A-Z])/g, ' $1').trim()}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Search bar placeholder */}
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '9999px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search..." 
            style={{ 
              border: 'none', 
              background: 'transparent', 
              outline: 'none', 
              marginLeft: '0.5rem',
              width: '150px'
            }} 
          />
        </div>

        {/* Notifications */}
        <button className="btn-outline flex-center" style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--danger-color)',
            borderRadius: '50%'
          }}></span>
        </button>

        {/* User Profile Snippet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            JD
          </div>
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>John Doe</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CS Engg - 3rd Year</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .search-bar { display: none !important; }
          .user-info { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
