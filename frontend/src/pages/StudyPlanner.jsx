import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'studyPlannerData'

const today = () => new Date().toISOString().split('T')[0]

const createDefaultTasks = () => [
  {
    id: 1,
    title: 'Mathematics',
    subject: 'Mathematics',
    date: today(),
    startTime: '09:00',
    duration: 60,
    type: 'Study',
    priority: 'High',
    completed: false,
  },
  {
    id: 2,
    title: 'Python Practice',
    subject: 'Python',
    date: today(),
    startTime: '18:00',
    duration: 60,
    type: 'Practice',
    priority: 'Medium',
    completed: false,
  },
]

const getInitialTasks = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return createDefaultTasks()
    }

    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) ? parsed : createDefaultTasks()
  } catch (error) {
    console.error('Study Planner storage error:', error)
    return createDefaultTasks()
  }
}

function StudyPlanner() {
  const [tasks, setTasks] = useState(getInitialTasks)
  const [showForm, setShowForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(today())
  const [filter, setFilter] = useState('All')

  const [form, setForm] = useState({
    title: '',
    subject: 'Mathematics',
    date: today(),
    startTime: '09:00',
    duration: 60,
    type: 'Study',
    priority: 'Medium',
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.error('Could not save Study Planner:', error)
    }
  }, [tasks])

  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    const day = date.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day

    date.setDate(date.getDate() + mondayOffset + index)

    return date.toISOString().split('T')[0]
  })

  const visibleTasks = tasks
    .filter((task) => task.date === selectedDate)
    .filter((task) => filter === 'All' || task.type === filter)
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))

  const completed = tasks.filter((task) => task.completed).length
  const totalMinutes = tasks.reduce(
    (total, task) => total + Number(task.duration || 0),
    0
  )
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0

  const addTask = (event) => {
    event.preventDefault()

    if (!form.title.trim()) return

    const newTask = {
      ...form,
      id: Date.now(),
      duration: Number(form.duration),
      completed: false,
    }

    setTasks((current) => [...current, newTask])
    setSelectedDate(form.date)
    setForm({
      title: '',
      subject: 'Mathematics',
      date: today(),
      startTime: '09:00',
      duration: 60,
      type: 'Study',
      priority: 'Medium',
    })
    setShowForm(false)
  }

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    )
  }

  const deleteTask = (id) => {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 12px',
    border: '1px solid #d9e0ea',
    borderRadius: '8px',
    fontSize: '14px',
    marginTop: '6px',
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#172033',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#64748b',
            letterSpacing: '1px',
            marginBottom: '6px',
          }}>
            PRODUCTIVITY
          </div>

          <h1 style={{ margin: 0, fontSize: '32px' }}>Study Planner</h1>

          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Plan your study sessions and track your progress.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            border: 0,
            borderRadius: '10px',
            padding: '12px 18px',
            background: '#172033',
            color: 'white',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          + Add Session
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '20px',
      }}>
        {[
          ['Total Sessions', tasks.length],
          ['Completed', completed],
          ['Pending', tasks.length - completed],
          ['Study Time', `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              background: 'white',
              border: '1px solid #e5eaf0',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div style={{ color: '#64748b', fontSize: '13px' }}>{label}</div>
            <div style={{ fontSize: '25px', fontWeight: '800', marginTop: '7px' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5eaf0',
        borderRadius: '12px',
        padding: '18px',
        marginBottom: '20px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <strong>Overall Progress</strong>
          <strong>{progress}%</strong>
        </div>

        <div style={{
          height: '8px',
          background: '#e9eef5',
          borderRadius: '99px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: '#2563eb',
            borderRadius: '99px',
          }} />
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5eaf0',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h2 style={{ marginTop: 0 }}>This Week</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
        }}>
          {weekDates.map((date) => {
            const d = new Date(`${date}T00:00:00`)
            const count = tasks.filter((task) => task.date === date).length
            const active = selectedDate === date

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                style={{
                  padding: '12px 6px',
                  borderRadius: '10px',
                  border: active ? '2px solid #2563eb' : '1px solid #e1e7ef',
                  background: active ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                </div>
                <strong style={{ display: 'block', fontSize: '20px', margin: '4px 0' }}>
                  {d.getDate()}
                </strong>
                <small>{count} session{count === 1 ? '' : 's'}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5eaf0',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h2 style={{ margin: 0 }}>
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <p style={{ color: '#64748b' }}>Today's planned study sessions</p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All', 'Study', 'Practice', 'Revision', 'Exam'].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d9e0ea',
                  background: filter === item ? '#172033' : 'white',
                  color: filter === item ? 'white' : '#172033',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '18px' }}>
          {visibleTasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 10px',
              color: '#64748b',
            }}>
              <div style={{ fontSize: '35px' }}>📚</div>
              <h3>No sessions planned</h3>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '10px 16px',
                  border: 0,
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Create Session
              </button>
            </div>
          ) : (
            visibleTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '16px',
                  border: '1px solid #e5eaf0',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '1px solid #cbd5e1',
                    background: task.completed ? '#2563eb' : 'white',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {task.completed ? '✓' : ''}
                </button>

                <div style={{ minWidth: '70px' }}>
                  <strong>{task.startTime}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {task.duration} min
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </h3>
                  <div style={{ color: '#64748b', marginTop: '4px' }}>
                    {task.subject} • {task.type} • {task.priority} priority
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    border: 0,
                    background: 'transparent',
                    fontSize: '22px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: 'white',
              width: '100%',
              maxWidth: '600px',
              borderRadius: '14px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Add Study Session</h2>

            <form onSubmit={addTask}>
              <label>
                Session Title
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Maths Unit 2 Revision"
                  required
                />
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginTop: '15px',
              }}>
                <label>
                  Subject
                  <select
                    style={inputStyle}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    <option>Mathematics</option>
                    <option>Python</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>English</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Type
                  <select
                    style={inputStyle}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option>Study</option>
                    <option>Practice</option>
                    <option>Revision</option>
                    <option>Exam</option>
                  </select>
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    style={inputStyle}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Start Time
                  <input
                    type="time"
                    style={inputStyle}
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="15"
                    step="15"
                    style={inputStyle}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Priority
                  <select
                    style={inputStyle}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '11px 16px',
                    border: '1px solid #d9e0ea',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '11px 16px',
                    border: 0,
                    borderRadius: '8px',
                    background: '#172033',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Add Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyPlanner