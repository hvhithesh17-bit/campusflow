import React, { useMemo, useState } from 'react'

const DEFAULT_SUBJECTS = [
  { id: 1, name: 'Mathematics', credits: 4, grade: 'A+' },
  { id: 2, name: 'Physics', credits: 4, grade: 'A+' },
  { id: 3, name: 'Chemistry', credits: 4, grade: 'A' },
  { id: 4, name: 'Python', credits: 3, grade: 'A+' },
  { id: 5, name: 'English', credits: 1, grade: 'A' },
]

const GRADE_POINTS = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
}

const createSubject = () => ({
  id: Date.now() + Math.random(),
  name: '',
  credits: 3,
  grade: 'A+',
})

function Sgpa() {
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS)

  const calculations = useMemo(() => {
    const totalCredits = subjects.reduce(
      (sum, subject) => sum + Number(subject.credits || 0),
      0
    )

    const totalPoints = subjects.reduce(
      (sum, subject) =>
        sum + Number(subject.credits || 0) * (GRADE_POINTS[subject.grade] ?? 0),
      0
    )

    return {
      totalCredits,
      totalPoints,
      sgpa: totalCredits ? (totalPoints / totalCredits).toFixed(2) : '0.00',
    }
  }, [subjects])

  const updateSubject = (id, field, value) => {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, [field]: value } : subject
      )
    )
  }

  const addSubject = () => {
    setSubjects((current) => [...current, createSubject()])
  }

  const removeSubject = (id) => {
    setSubjects((current) => {
      if (current.length === 1) return current
      return current.filter((subject) => subject.id !== id)
    })
  }

  const resetCalculator = () => {
    setSubjects(DEFAULT_SUBJECTS)
  }

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '24px',
      color: '#172033',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '1px',
          marginBottom: '6px',
        }}>
          ACADEMICS
        </div>

        <h1 style={{ margin: 0, fontSize: '32px' }}>SGPA Calculator</h1>

        <p style={{ color: '#64748b', marginTop: '8px' }}>
          Enter your subjects, credits, and grades to calculate your semester SGPA.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div style={cardStyle}>
          <div style={labelStyle}>SGPA</div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>
            {calculations.sgpa}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Total Credits</div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>
            {calculations.totalCredits}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Credit Points</div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>
            {calculations.totalPoints}
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Subjects</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              Grade points: O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0
            </p>
          </div>

          <button onClick={addSubject} style={primaryButton}>
            + Add Subject
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '650px',
          }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Credits</th>
                <th style={thStyle}>Grade</th>
                <th style={thStyle}>Grade Point</th>
                <th style={thStyle}>Credit Point</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((subject, index) => {
                const gradePoint = GRADE_POINTS[subject.grade] ?? 0
                const creditPoint =
                  Number(subject.credits || 0) * gradePoint

                return (
                  <tr key={subject.id}>
                    <td style={tdStyle}>{index + 1}</td>

                    <td style={tdStyle}>
                      <input
                        value={subject.name}
                        placeholder="Subject name"
                        onChange={(event) =>
                          updateSubject(subject.id, 'name', event.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={subject.credits}
                        onChange={(event) =>
                          updateSubject(
                            subject.id,
                            'credits',
                            event.target.value
                          )
                        }
                        style={{ ...inputStyle, width: '90px' }}
                      />
                    </td>

                    <td style={tdStyle}>
                      <select
                        value={subject.grade}
                        onChange={(event) =>
                          updateSubject(
                            subject.id,
                            'grade',
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      >
                        {Object.keys(GRADE_POINTS).map((grade) => (
                          <option key={grade}>{grade}</option>
                        ))}
                      </select>
                    </td>

                    <td style={tdStyle}>
                      <strong>{gradePoint}</strong>
                    </td>

                    <td style={tdStyle}>
                      <strong>{creditPoint}</strong>
                    </td>

                    <td style={tdStyle}>
                      <button
                        onClick={() => removeSubject(subject.id)}
                        style={deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '20px',
        }}>
          <button onClick={resetCalculator} style={secondaryButton}>
            Reset
          </button>

          <div style={{
            padding: '12px 18px',
            borderRadius: '9px',
            background: '#172033',
            color: 'white',
            fontWeight: 800,
          }}>
            SGPA: {calculations.sgpa}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '18px',
        padding: '15px 18px',
        borderRadius: '10px',
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        color: '#9a3412',
        fontSize: '13px',
      }}>
        Formula: SGPA = Σ(Credit × Grade Point) ÷ Σ(Credits)
      </div>
    </div>
  )
}

const cardStyle = {
  background: 'white',
  border: '1px solid #e5eaf0',
  borderRadius: '12px',
  padding: '18px',
}

const labelStyle = {
  color: '#64748b',
  fontSize: '13px',
  marginBottom: '6px',
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 11px',
  border: '1px solid #d9e0ea',
  borderRadius: '8px',
  fontSize: '14px',
}

const thStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '1px solid #e5eaf0',
  color: '#64748b',
  fontSize: '13px',
}

const tdStyle = {
  padding: '10px',
  borderBottom: '1px solid #eef2f7',
  verticalAlign: 'middle',
}

const primaryButton = {
  border: 0,
  borderRadius: '8px',
  padding: '10px 15px',
  background: '#172033',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButton = {
  border: '1px solid #d9e0ea',
  borderRadius: '8px',
  padding: '10px 15px',
  background: 'white',
  color: '#172033',
  fontWeight: 700,
  cursor: 'pointer',
}

const deleteButton = {
  border: 0,
  borderRadius: '7px',
  padding: '8px 10px',
  background: '#fee2e2',
  color: '#b91c1c',
  cursor: 'pointer',
}

export default Sgpa