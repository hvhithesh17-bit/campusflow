import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import SubjectCard from '../components/SubjectCard';

const Subjects = () => {
  // 1. We use useState to hold the list of subjects. 
  // We start with an empty array because data will come from Firestore.
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null); // Add error state

  // Fetch subjects from Firestore when the component loads
  useEffect(() => {
    try {
      // onSnapshot listens to the 'subjects' collection in real-time
      const unsubscribe = onSnapshot(
        collection(db, 'subjects'), 
        (snapshot) => {
          const subjectsData = [];
          snapshot.forEach((doc) => {
            subjectsData.push({ id: doc.id, ...doc.data() });
          });
          setSubjects(subjectsData);
          setError(null); // Clear errors if successful
        },
        (error) => {
          console.error("Firestore error:", error);
          setError("Could not connect to Firebase! Did you replace the API keys in firebase.js?");
        }
      );

      // Cleanup the listener when the component unmounts
      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to setup Firebase listener:", err);
      setError("Failed to initialize Firebase.");
    }
  }, []);

  // 2. We use useState for the form inputs.
  const [subjectName, setSubjectName] = useState('');
  const [credits, setCredits] = useState('');

  // 3. This function handles the form submission
  const handleAddSubject = async (e) => {
    // e.preventDefault() stops the browser from reloading the page
    e.preventDefault(); 
    
    // Create a new subject object from the form state
    // We NO LONGER generate our own ID. Firestore will generate one for us!
    const newSubject = {
      name: subjectName,
      credits: Number(credits),
      code: 'NEW' + Math.floor(Math.random() * 900 + 100), // Random dummy code
      attendance: '0', 
      grade: 'N/A'
    };

    try {
      // Add the new subject to the 'subjects' collection in Firestore
      // addDoc automatically generates a unique ID for the document
      await addDoc(collection(db, 'subjects'), newSubject);
      
      // 4. Clear the form by resetting the state variables
      // Note: We don't need to manually update the 'subjects' array state anymore,
      // because our onSnapshot listener above will automatically detect the new 
      // document and update the state for us!
      setSubjectName('');
      setCredits('');
      setError(null);
    } catch (error) {
      console.error("Error adding document: ", error);
      setError("Failed to add subject! Make sure your Firestore Database is created and set to Test Mode.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>My Subjects</h1>
        <p>Manage your enrolled subjects and track performance.</p>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

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
        {subjects.length === 0 && !error ? (
          <p>No subjects found. Add one above!</p>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Subjects;
