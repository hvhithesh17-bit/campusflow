import React from 'react';
import { GraduationCap, Calendar, Clock, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import SubjectCard from '../components/SubjectCard';
import AssignmentCard from '../components/AssignmentCard';

const Dashboard = () => {
  // Dummy Data
  const stats = [
    { title: 'Current SGPA', value: '9', icon: GraduationCap, trend: '0.2', trendUp: true },
    { title: 'Overall Attendance', value: '78%', icon: Calendar, trend: '2%', trendUp: false },
    { title: 'Pending Assignments', value: '4', icon: Clock },
    { title: 'Upcoming Exams', value: '2', icon: Activity }
  ];

  const subjects = [
    { id: 1, name: 'Data Structures', code: 'CS301', attendance: '82', grade: 'A' },
    { id: 2, name: 'Operating Systems', code: 'CS302', attendance: '71', grade: 'B+' },
    { id: 3, name: 'Computer Networks', code: 'CS303', attendance: '88', grade: 'A-' }
  ];

  const assignments = [
    { id: 1, title: 'Process Scheduling Algo', subject: 'Operating Systems', dueDate: 'Today, 11:59 PM', status: 'Pending' },
    { id: 2, title: 'TCP/IP Model Essay', subject: 'Computer Networks', dueDate: 'Tomorrow', status: 'Pending' },
    { id: 3, title: 'Binary Tree Implementation', subject: 'Data Structures', dueDate: 'Oct 15', status: 'Completed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome Section */}
      <div>
        <h1 style={{ marginBottom: '0.25rem' }}>Welcome back, John! 👋</h1>
        <p style={{ margin: 0 }}>Here is what's happening with your academics today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Subjects & Performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex-between">
            <h2 style={{ margin: 0 }}>Subject Performance</h2>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>View All</button>
          </div>
          <div className="grid grid-cols-2">
            {subjects.map(subject => (
              <SubjectCard key={subject.id} {...subject} />
            ))}
          </div>
        </div>

        {/* Right Column: Assignments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex-between">
            <h2 style={{ margin: 0 }}>Assignments</h2>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map(assignment => (
              <AssignmentCard key={assignment.id} {...assignment} />
            ))}
          </div>
        </div>

      </div>

      {/* Responsive layout fix for Dashboard columns */}
      <style>{`
        @media (max-width: 1024px) {
          .grid[style*="grid-template-columns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
