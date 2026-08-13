import React, { useState } from 'react';
import AssignmentCard from '../components/AssignmentCard';

const Assignments = () => {
  // 1. Initialize state with a list of assignments
  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Process Scheduling Algo', subject: 'Operating Systems', dueDate: 'Today, 11:59 PM', status: 'Pending' },
    { id: 2, title: 'TCP/IP Model Essay', subject: 'Computer Networks', dueDate: 'Tomorrow', status: 'Pending' },
    { id: 3, title: 'Binary Tree Implementation', subject: 'Data Structures', dueDate: 'Oct 15', status: 'Completed' },
  ]);

  // 2. Create the function that modifies the state
  const handleMarkComplete = (idToComplete) => {
    // We map over the current assignments
    // If the ID matches, we return a new object with status changed to 'Completed'
    // Otherwise, we return the assignment as is
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === idToComplete) {
        return { ...assignment, status: 'Completed' };
      }
      return assignment;
    });

    // 3. Update the state with the new array
    setAssignments(updatedAssignments);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>Assignments</h1>
        <p>Keep track of your pending tasks and deadlines.</p>
      </div>

      <div className="grid grid-cols-3">
        {assignments.map(assignment => (
          <AssignmentCard 
            key={assignment.id} 
            title={assignment.title}
            subject={assignment.subject}
            dueDate={assignment.dueDate}
            status={assignment.status}
            // 4. Pass the function down to the card, pre-filled with the assignment's ID
            onMarkComplete={() => handleMarkComplete(assignment.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Assignments;
