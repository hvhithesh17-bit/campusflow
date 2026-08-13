import React, { useState } from 'react';

const Attendance = () => {
  // 1. Define state variables for the form inputs
  const [subject, setSubject] = useState('');
  const [totalClasses, setTotalClasses] = useState('');
  const [attendedClasses, setAttendedClasses] = useState('');

  // 2. Convert string inputs to numbers for calculation
  const total = Number(totalClasses);
  const attended = Number(attendedClasses);
  
  // 3. Calculate percentage
  let percentage = 0;
  if (total > 0) {
    percentage = (attended / total) * 100;
  }

  // 4. Determine if a warning should be shown
  const isLowAttendance = total > 0 && percentage < 75;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>Attendance Tracker</h1>
        <p>Calculate your attendance and ensure you meet the 75% criteria.</p>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Calculate Attendance</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Subject Name
            </label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Total Classes
            </label>
            <input 
              type="number"
              value={totalClasses}
              onChange={(e) => setTotalClasses(e.target.value)}
              placeholder="e.g. 40"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              min="0"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Classes Attended
            </label>
            <input 
              type="number"
              value={attendedClasses}
              onChange={(e) => setAttendedClasses(e.target.value)}
              placeholder="e.g. 28"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              min="0"
            />
          </div>
        </div>

        {/* Results Section - Automatically updates as user types because state changes trigger re-renders */}
        {total > 0 && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-primary)', 
            borderRadius: '8px',
            border: `1px solid ${isLowAttendance ? 'var(--danger-color)' : 'var(--success-color)'}`
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Result for {subject || 'Subject'}</h3>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
              Attendance: {percentage.toFixed(2)}%
            </p>
            
            {isLowAttendance ? (
              <p style={{ color: 'var(--danger-color)', margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 500 }}>
                ⚠️ Warning: Your attendance is below 75%. You need to attend more classes!
              </p>
            ) : (
              <p style={{ color: 'var(--success-color)', margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 500 }}>
                ✅ Great job! Your attendance is on track.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
