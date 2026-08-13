import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{title}</h3>
        <div style={{ 
          padding: '0.5rem', 
          backgroundColor: 'var(--bg-primary)', 
          borderRadius: '8px',
          color: 'var(--accent-color)'
        }}>
          <Icon size={20} />
        </div>
      </div>
      
      <div>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {value}
        </p>
        {trend && (
          <p style={{ 
            fontSize: '0.75rem', 
            marginTop: '0.25rem',
            color: trendUp ? 'var(--success-color)' : 'var(--danger-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
