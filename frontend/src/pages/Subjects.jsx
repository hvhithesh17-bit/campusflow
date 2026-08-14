import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import SubjectCard from '../components/SubjectCard';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // CREATE form
  const [subjectName, setSubjectName] = useState('');
  const [credits, setCredits] = useState('');

  // UPDATE form
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editCredits, setEditCredits] = useState('');

  // READ - Listen to Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'subjects'),
        (snapshot) => {
          const subjectsData = [];

          snapshot.forEach((doc) => {
            subjectsData.push({
              id: doc.id,
              ...doc.data()
            });
          });

          setSubjects(subjectsData);
          setError(null);
        },
        (error) => {
          console.error('Firestore error:', error);
          setError(
            'Could not connect to Firebase. Check your Firebase configuration.'
          );
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to setup Firebase listener:', err);
      setError('Failed to initialize Firebase.');
    }
  }, []);

  // CREATE
  const handleAddSubject = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    // Validate subject name
    if (!subjectName.trim()) {
      setError('Please enter a subject name.');
      return;
    }

    // Validate credits
    if (!credits || Number(credits) <= 0) {
      setError('Please enter valid credits greater than 0.');
      return;
    }

    try {
      const newSubject = {
        name: subjectName.trim(),
        credits: Number(credits),
        code: 'NEW' + Math.floor(Math.random() * 900 + 100),
        attendance: '0',
        grade: 'N/A'
      };

      await addDoc(
        collection(db, 'subjects'),
        newSubject
      );

      setSubjectName('');
      setCredits('');

      setSuccess('Subject added successfully!');
    } catch (error) {
      console.error('Error adding document:', error);

      setError(
        'Failed to add subject. Please check your Firestore connection.'
      );
    }
  };

  // Start editing a subject
  const handleEditClick = (subject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.name || '');
    setEditCredits(subject.credits || '');

    setError(null);
    setSuccess(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSubjectId(null);
    setEditSubjectName('');
    setEditCredits('');

    setError(null);
  };

  // UPDATE
  const handleUpdateSubject = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    // Validate
    if (!editSubjectName.trim()) {
      setError('Please enter a subject name.');
      return;
    }

    if (!editCredits || Number(editCredits) <= 0) {
      setError('Please enter valid credits greater than 0.');
      return;
    }

    try {
      // Create reference to the existing Firestore document
      const subjectRef = doc(
        db,
        'subjects',
        editingSubjectId
      );

      // Update only name and credits
      await updateDoc(subjectRef, {
        name: editSubjectName.trim(),
        credits: Number(editCredits)
      });

      // Exit edit mode
      setEditingSubjectId(null);
      setEditSubjectName('');
      setEditCredits('');

      setSuccess('Subject updated successfully!');
    } catch (error) {
      console.error('Error updating subject:', error);

      setError(
        'Failed to update subject. Please try again.'
      );
    }
  };

  // DELETE
  const handleDeleteSubject = async (subjectId) => {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this subject?'
  );

  if (!confirmDelete) {
    return;
  }

  setError(null);
  setSuccess(null);

  try {
    const subjectRef = doc(
      db,
      'subjects',
      subjectId
    );

    await deleteDoc(subjectRef);

    setSuccess('Subject deleted successfully!');
  } catch (error) {
    console.error('Error deleting subject:', error);

    setError(
      'Failed to delete subject. Please try again.'
    );
  }
};

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}
    >

      {/* Page Header */}
      <div>
        <h1>My Subjects</h1>
        <p>
          Manage your enrolled subjects and track performance.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--danger-color)',
            color: 'white',
            borderRadius: '8px'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'green',
            color: 'white',
            borderRadius: '8px'
          }}
        >
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* ADD SUBJECT */}
      <div
        className="card"
        style={{ maxWidth: '500px' }}
      >
        <h2 style={{ marginBottom: '1rem' }}>
          Add New Subject
        </h2>

        <form
          onSubmit={handleAddSubject}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >

          {/* Subject Name */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Subject Name
            </label>

            <input
              type="text"
              value={subjectName}
              onChange={(e) =>
                setSubjectName(e.target.value)
              }
              placeholder="e.g. Computer Networks"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            />
          </div>

          {/* Credits */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Credits
            </label>

            <input
              type="number"
              value={credits}
              onChange={(e) =>
                setCredits(e.target.value)
              }
              placeholder="e.g. 3"
              min="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
          >
            Add Subject
          </button>
        </form>
      </div>

      {/* SUBJECTS */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>
          Current Subjects
        </h2>

        {subjects.length === 0 && !error ? (
          <p>No subjects found. Add one above!</p>
        ) : (
          <div className="grid grid-cols-3">

            {subjects.map((subject) => (

              <div key={subject.id}>

                {/* EDIT FORM */}
                {editingSubjectId === subject.id ? (

                  <div
                    className="card"
                    style={{
                      padding: '1.5rem'
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: '1rem'
                      }}
                    >
                      Edit Subject
                    </h3>

                    <form
                      onSubmit={handleUpdateSubject}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                      }}
                    >

                      {/* Edit Name */}
                      <input
                        type="text"
                        value={editSubjectName}
                        onChange={(e) =>
                          setEditSubjectName(e.target.value)
                        }
                        placeholder="Subject Name"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      />

                      {/* Edit Credits */}
                      <input
                        type="number"
                        value={editCredits}
                        onChange={(e) =>
                          setEditCredits(e.target.value)
                        }
                        placeholder="Credits"
                        min="1"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}
                      />

                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem'
                        }}
                      >
                        <button
                          type="submit"
                          className="btn btn-primary"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          className="btn"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>

                    </form>
                  </div>

                ) : (

                  /* NORMAL SUBJECT CARD */
                  <div>
                    <SubjectCard
                      name={subject.name}
                      code={subject.code}
                      attendance={subject.attendance}
                      grade={subject.grade}
                    />

                    {/* EDIT BUTTON */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}
                    >
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleEditClick(subject)}
                        style={{
                          flex: 1
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeleteSubject(subject.id)}
                        style={{
                          flex: 1,
                          backgroundColor: 'var(--danger-color)',
                          color: 'white'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                )}

              </div>

            ))}

          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;