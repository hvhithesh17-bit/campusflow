import React from 'react';

const SubjectCard = ({ name, code, attendance, grade }) => {
  // Calculate attendance color
  const attendanceNum = parseFloat(attendance);
  const attendanceColor = attendanceNum >= 75 ? 'var(--success-color)' : 'var(--danger-color)';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{name}</h3>
          <span className="badge badge-primary">{code}</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Attendance</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: attendanceColor }}>{attendance}%</span>
          </div>
          {/* Simple progress bar */}
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', marginTop: '0.25rem' }}>
            <div style={{ width: `${attendanceNum}%`, height: '100%', backgroundColor: attendanceColor, borderRadius: '2px' }}></div>
          </div>
        </div>
        
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Grade</p>
          <span style={{ fontWeight: 600 }}>{grade}</span>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;
