import React, { useState } from 'react';
import SubjectCard from '../components/SubjectCard';

const Subjects = () => {
  // 1. We use useState to hold the list of subjects. 
  // We provide some initial dummy data so the list isn't empty.
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Data Structures', credits: 4, code: 'CS301', attendance: '82', grade: 'A' },
    { id: 2, name: 'Operating Systems', credits: 3, code: 'CS302', attendance: '71', grade: 'B+' }
  ]);

  // 2. We use useState for the form inputs.
  const [subjectName, setSubjectName] = useState('');
  const [credits, setCredits] = useState('');

  // 3. This function handles the form submission
  const handleAddSubject = (e) => {
    // e.preventDefault() stops the browser from reloading the page,
    // which is the default behavior of an HTML form submission.
    e.preventDefault(); 
    
    // Create a new subject object from the form state
    const newSubject = {
      id: Date.now(), // Generate a unique dummy ID using the current time
      name: subjectName,
      credits: Number(credits),
      code: 'NEW' + Math.floor(Math.random() * 900 + 100), // Random dummy code
      attendance: '0', 
      grade: 'N/A'
    };

    // Update the subjects array by keeping existing subjects and adding the new one
    setSubjects([...subjects, newSubject]);
    
    // 4. Clear the form by resetting the state variables
    setSubjectName('');
    setCredits('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>My Subjects</h1>
        <p>Manage your enrolled subjects and track performance.</p>
      </div>

      {/* Add Subject Form Section */}
      <div className="card" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Add New Subject</h2>
        <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Subject Name
            </label>
            <input 
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Computer Networks"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Credits
            </label>
            <input 
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="e.g. 3"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Add Subject
          </button>
        </form>
      </div>

      {/* Display the Subjects List */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Current Subjects</h2>
        <div className="grid grid-cols-3">
          {subjects.map(subject => (
            <SubjectCard 
              key={subject.id} 
              name={subject.name}
              code={subject.code}
              attendance={subject.attendance}
              grade={subject.grade}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subjects;
