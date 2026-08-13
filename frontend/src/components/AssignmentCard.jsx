import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const AssignmentCard = ({ title, subject, dueDate, status, onMarkComplete }) => {
  // Determine styles based on status
  let statusColor, StatusIcon;
  
  if (status === 'Pending') {
    statusColor = 'var(--warning-color)';
    StatusIcon = Clock;
  } else if (status === 'Completed') {
    statusColor = 'var(--success-color)';
    StatusIcon = CheckCircle;
  } else {
    statusColor = 'var(--danger-color)';
    StatusIcon = AlertCircle;
  }

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subject}</p>
        </div>
        <span 
          className={`badge`} 
          style={{ 
            backgroundColor: `${statusColor}20`, // 20% opacity background
            color: statusColor,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <StatusIcon size={14} />
          {status}
        </span>
      </div>
      
      <div style={{ 
        marginTop: '1rem', 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={14} color="var(--text-secondary)" />
          <span>Due: <strong>{dueDate}</strong></span>
        </p>

        {status === 'Pending' && onMarkComplete && (
          <button 
            className="btn btn-primary" 
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            onClick={onMarkComplete}
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default AssignmentCard;
