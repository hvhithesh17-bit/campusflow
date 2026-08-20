import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Plus,
  Search,
  Target,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

import {
  subjectsAPI,
  studyTasksAPI,
} from "../../services/api";

import "./StudyPlanner.css";

/* =========================================================
   HELPERS
========================================================= */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getHours(start, end) {
  if (!start || !end) return 0;

  const [startHour, startMinute] =
    start.split(":").map(Number);

  const [endHour, endMinute] =
    end.split(":").map(Number);

  const startValue =
    startHour * 60 + startMinute;

  const endValue =
    endHour * 60 + endMinute;

  return Math.max(
    0,
    (endValue - startValue) / 60
  );
}

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] =
    time.split(":").map(Number);

  const period =
    hours >= 12 ? "PM" : "AM";

  const hour =
    hours % 12 || 12;

  return `${hour}:${String(
    minutes
  ).padStart(2, "0")} ${period}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function StudyPlanner() {
  /* =======================================================
     STATE
  ======================================================= */

  const [subjects, setSubjects] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("All Subjects");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [dateFilter, setDateFilter] =
    useState("All");

  const [showForm, setShowForm] =
    useState(false);

  const today = getToday();

  const [form, setForm] =
    useState({
      title: "",
      subjectId: "",
      topic: "",
      date: today,
      startTime: "18:00",
      endTime: "19:00",
      priority: "Medium",
    });

  /* =======================================================
     LOAD SUBJECTS + TASKS
  ======================================================= */

  const loadData = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          subjectsResponse,
          tasksResponse,
        ] = await Promise.all([
          subjectsAPI.getAll(),
          studyTasksAPI.getAll(),
        ]);

        console.log(
          "STUDY PLANNER SUBJECTS:",
          subjectsResponse
        );

        console.log(
          "STUDY PLANNER TASKS:",
          tasksResponse
        );

        const loadedSubjects =
          Array.isArray(
            subjectsResponse?.subjects
          )
            ? subjectsResponse.subjects
            : [];

        const loadedTasks =
          Array.isArray(
            tasksResponse?.tasks
          )
            ? tasksResponse.tasks
            : [];

        setSubjects(
          loadedSubjects
        );

        setTasks(
          loadedTasks
        );

        /*
          If there is no selected subject,
          automatically select the first
          MongoDB subject.
        */

        setForm(
          (current) => ({
            ...current,

            subjectId:
              current.subjectId ||
              loadedSubjects[0]?._id ||
              "",
          })
        );
      } catch (err) {
        console.error(
          "Study planner load error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load study planner."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     FILTERED TASKS
  ======================================================= */

  const filteredTasks =
    useMemo(() => {
      return tasks
        .filter((task) => {
          const taskTitle =
            task?.title || "";

          const taskTopic =
            task?.topic || "";

          const taskSubject =
            task?.subject?.name ||
            "";

          const searchValue =
            search
              .toLowerCase()
              .trim();

          const matchesSearch =
            !searchValue ||
            taskTitle
              .toLowerCase()
              .includes(searchValue) ||
            taskTopic
              .toLowerCase()
              .includes(searchValue) ||
            taskSubject
              .toLowerCase()
              .includes(searchValue);

          const matchesSubject =
            subjectFilter ===
              "All Subjects" ||
            task?.subject?._id ===
              subjectFilter;

          const matchesStatus =
            statusFilter === "All" ||
            (statusFilter ===
              "Pending" &&
              !task.completed) ||
            (statusFilter ===
              "Completed" &&
              task.completed);

          const matchesDate =
            dateFilter === "All" ||
            (dateFilter === "Today" &&
              task.date === today) ||
            (dateFilter ===
              "Upcoming" &&
              task.date > today);

          return (
            matchesSearch &&
            matchesSubject &&
            matchesStatus &&
            matchesDate
          );
        })
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(
              b.date
            );
          }

          return (
            a.startTime || ""
          ).localeCompare(
            b.startTime || ""
          );
        });
    }, [
      tasks,
      search,
      subjectFilter,
      statusFilter,
      dateFilter,
      today,
    ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const todayTasks =
    tasks.filter(
      (task) =>
        task.date === today
    );

  const pendingTasks =
    tasks.filter(
      (task) =>
        !task.completed
    );

  const completedTasks =
    tasks.filter(
      (task) =>
        task.completed
    );

  const totalHours =
    tasks.reduce(
      (sum, task) =>
        sum +
        getHours(
          task.startTime,
          task.endTime
        ),
      0
    );

  const todayHours =
    todayTasks.reduce(
      (sum, task) =>
        sum +
        getHours(
          task.startTime,
          task.endTime
        ),
      0
    );

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );

    if (error) {
      setError("");
    }
  };

  /* =======================================================
     OPEN FORM
  ======================================================= */

  const openForm = () => {
    setError("");

    setForm({
      title: "",
      subjectId:
        subjects[0]?._id || "",
      topic: "",
      date: today,
      startTime: "18:00",
      endTime: "19:00",
      priority: "Medium",
    });

    setShowForm(true);
  };

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setError("");
  };

  /* =======================================================
     ADD TASK
  ======================================================= */

  const addTask = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError(
        "Please enter a task title."
      );
      return;
    }

    if (!form.subjectId) {
      setError(
        "Please select a subject."
      );
      return;
    }

    if (!form.date) {
      setError(
        "Please select a date."
      );
      return;
    }

    if (!form.startTime) {
      setError(
        "Please select a start time."
      );
      return;
    }

    if (!form.endTime) {
      setError(
        "Please select an end time."
      );
      return;
    }

    if (
      form.endTime <=
      form.startTime
    ) {
      setError(
        "End time must be after start time."
      );
      return;
    }

    try {
      setSaving(true);

      const response =
        await studyTasksAPI.create({
          title:
            form.title.trim(),

          subjectId:
            form.subjectId,

          topic:
            form.topic.trim(),

          date:
            form.date,

          startTime:
            form.startTime,

          endTime:
            form.endTime,

          priority:
            form.priority,
        });

      console.log(
        "STUDY TASK CREATED:",
        response
      );

      if (
        !response?.success
      ) {
        throw new Error(
          response?.message ||
            "Unable to create study task."
        );
      }

      setShowForm(false);

      setForm({
        title: "",
        subjectId:
          subjects[0]?._id || "",
        topic: "",
        date: today,
        startTime: "18:00",
        endTime: "19:00",
        priority: "Medium",
      });

      await loadData();
    } catch (err) {
      console.error(
        "Add study task error:",
        err
      );

      setError(
        err?.message ||
          "Unable to add study task."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     TOGGLE TASK
  ======================================================= */

  const toggleTask =
    async (task) => {
      try {
        setError("");

        const response =
          await studyTasksAPI.update(
            task._id,
            {
              completed:
                !task.completed,
            }
          );

        console.log(
          "TASK UPDATED:",
          response
        );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to update task."
          );
        }

        setTasks(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                task._id
                  ? {
                      ...item,
                      completed:
                        !task.completed,
                    }
                  : item
            )
        );
      } catch (err) {
        console.error(
          "Toggle task error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update study task."
        );
      }
    };

  /* =======================================================
     DELETE TASK
  ======================================================= */

  const deleteTask =
    async (task) => {
      if (!task?._id) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${task.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await studyTasksAPI.delete(
          task._id
        );

        setTasks(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                task._id
            )
        );
      } catch (err) {
        console.error(
          "Delete study task error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete study task."
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="study-planner-page">
        <div className="study-empty">
          <div className="study-empty-icon">
            <Clock3 size={25} />
          </div>

          <h3>
            Loading study planner...
          </h3>

          <p>
            Loading your subjects and
            study sessions.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="study-planner-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="study-planner-header">

        <div>

          <div className="study-planner-eyebrow">
            <Target size={16} />

            Personal Planning
          </div>

          <h1>
            Study Planner
          </h1>

          <p>
            Plan your study sessions and
            stay consistent with your goals.
          </p>

        </div>

        <button
          type="button"
          className="study-add-button"
          onClick={openForm}
          disabled={
            subjects.length === 0
          }
        >
          <Plus size={18} />

          Add Study Task
        </button>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="study-error">

          <AlertCircle
            size={17}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>

        </div>
      )}

      {/* =================================================
          NO SUBJECTS
      ================================================= */}

      {subjects.length ===
        0 && (
        <div className="study-empty">

          <div className="study-empty-icon">
            <BookOpen size={25} />
          </div>

          <h3>
            Add subjects first
          </h3>

          <p>
            Your Study Planner uses
            subjects from MongoDB. Add
            at least one subject before
            creating a study task.
          </p>

        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="study-summary">

        <div className="study-summary-card">

          <div className="study-summary-icon blue">
            <CalendarDays size={19} />
          </div>

          <div>
            <span>
              Today's Tasks
            </span>

            <strong>
              {todayTasks.length}
            </strong>
          </div>

        </div>

        <div className="study-summary-card">

          <div className="study-summary-icon purple">
            <Clock3 size={19} />
          </div>

          <div>
            <span>
              Today's Hours
            </span>

            <strong>
              {todayHours.toFixed(
                1
              )}
              h
            </strong>
          </div>

        </div>

        <div className="study-summary-card">

          <div className="study-summary-icon orange">
            <Target size={19} />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {pendingTasks.length}
            </strong>
          </div>

        </div>

        <div className="study-summary-card">

          <div className="study-summary-icon green">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {completedTasks.length}
            </strong>
          </div>

        </div>

      </section>

      {/* =================================================
          DAILY GOAL
      ================================================= */}

      <section className="study-goal">

        <div className="study-goal-icon">
          <Target size={20} />
        </div>

        <div className="study-goal-content">

          <div className="study-goal-header">

            <strong>
              Today's Study Goal
            </strong>

            <span>
              {todayHours.toFixed(
                1
              )}{" "}
              / 3 hours
            </span>

          </div>

          <div className="study-goal-progress">

            <div
              style={{
                width: `${Math.min(
                  (todayHours / 3) *
                    100,
                  100
                )}%`,
              }}
            />

          </div>

        </div>

      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="study-toolbar">

        <div className="study-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search study tasks..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}

        </div>

        <select
          value={dateFilter}
          onChange={(event) =>
            setDateFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All Dates
          </option>

          <option value="Today">
            Today
          </option>

          <option value="Upcoming">
            Upcoming
          </option>
        </select>

        <select
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(
              event.target.value
            )
          }
        >
          <option value="All Subjects">
            All Subjects
          </option>

          {subjects.map(
            (subject) => (
              <option
                key={subject._id}
                value={subject._id}
              >
                {subject.name}
              </option>
            )
          )}

        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All Status
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Completed">
            Completed
          </option>
        </select>

      </section>

      {/* =================================================
          TASK LIST
      ================================================= */}

      <section className="study-list-section">

        <div className="study-list-header">

          <div>

            <h2>
              Study Sessions
            </h2>

            <p>
              {filteredTasks.length}{" "}
              session
              {filteredTasks.length !==
              1
                ? "s"
                : ""}
            </p>

          </div>

        </div>

        {filteredTasks.length ===
        0 ? (
          <div className="study-empty">

            <div className="study-empty-icon">
              <BookOpen size={25} />
            </div>

            <h3>
              No study sessions found
            </h3>

            <p>
              Add a study session or
              change your filters.
            </p>

            {subjects.length >
              0 && (
              <button
                type="button"
                onClick={
                  openForm
                }
              >
                <Plus size={16} />

                Add Study Task
              </button>
            )}

          </div>
        ) : (
          <div className="study-task-list">

            {filteredTasks.map(
              (task) => (
                <article
                  className={`study-task ${
                    task.completed
                      ? "completed"
                      : ""
                  }`}
                  key={
                    task._id
                  }
                >

                  {/* CHECK */}

                  <button
                    type="button"
                    className={`study-check ${
                      task.completed
                        ? "checked"
                        : ""
                    }`}
                    onClick={() =>
                      toggleTask(
                        task
                      )
                    }
                    aria-label={
                      task.completed
                        ? "Mark pending"
                        : "Mark completed"
                    }
                  >
                    {task.completed && (
                      <Check
                        size={14}
                      />
                    )}
                  </button>

                  {/* MAIN */}

                  <div className="study-task-main">

                    <div className="study-task-top">

                      <span className="study-task-subject">

                        {task
                          ?.subject
                          ?.name ||
                          "Unknown Subject"}

                      </span>

                      <span
                        className={`study-task-priority ${
                          (
                            task.priority ||
                            "Medium"
                          ).toLowerCase()
                        }`}
                      >
                        {task.priority ||
                          "Medium"}
                      </span>

                    </div>

                    <h3>
                      {task.title}
                    </h3>

                    {task.topic && (
                      <span className="study-task-topic">
                        {task.topic}
                      </span>
                    )}

                    <div className="study-task-meta">

                      <span>
                        <CalendarDays
                          size={13}
                        />

                        {formatDate(
                          task.date
                        )}
                      </span>

                      <span>
                        <Clock3
                          size={13}
                        />

                        {formatTime(
                          task.startTime
                        )}

                        {" - "}

                        {formatTime(
                          task.endTime
                        )}
                      </span>

                      <span>
                        {getHours(
                          task.startTime,
                          task.endTime
                        ).toFixed(
                          1
                        )}
                        h
                      </span>

                    </div>

                  </div>

                  {/* DELETE */}

                  <button
                    type="button"
                    className="study-delete"
                    onClick={() =>
                      deleteTask(
                        task
                      )
                    }
                    aria-label="Delete study task"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>

                </article>
              )
            )}

          </div>
        )}

      </section>

      {/* =================================================
          ADD TASK MODAL
      ================================================= */}

      {showForm && (
        <div
          className="study-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="study-modal">

            <div className="study-modal-header">

              <div>

                <h2>
                  Add Study Task
                </h2>

                <p>
                  Plan your next study
                  session.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                aria-label="Close"
                disabled={
                  saving
                }
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                addTask
              }
            >

              {/* TITLE */}

              <div className="study-form-group">

                <label htmlFor="study-title">
                  Task Title
                </label>

                <input
                  id="study-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Revise Unit 2"
                  value={
                    form.title
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              {/* SUBJECT + PRIORITY */}

              <div className="study-form-row">

                <div className="study-form-group">

                  <label htmlFor="study-subject">
                    Subject
                  </label>

                  <select
                    id="study-subject"
                    name="subjectId"
                    value={
                      form.subjectId
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map(
                      (
                        subject
                      ) => (
                        <option
                          key={
                            subject._id
                          }
                          value={
                            subject._id
                          }
                        >
                          {
                            subject.name
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="study-form-group">

                  <label htmlFor="study-priority">
                    Priority
                  </label>

                  <select
                    id="study-priority"
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="High">
                      High
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="Low">
                      Low
                    </option>
                  </select>

                </div>

              </div>

              {/* TOPIC */}

              <div className="study-form-group">

                <label htmlFor="study-topic">
                  Topic
                  <span>
                    Optional
                  </span>
                </label>

                <input
                  id="study-topic"
                  name="topic"
                  type="text"
                  placeholder="e.g. Unit 3"
                  value={
                    form.topic
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* DATE */}

              <div className="study-form-group">

                <label htmlFor="study-date">
                  Date
                </label>

                <input
                  id="study-date"
                  name="date"
                  type="date"
                  value={
                    form.date
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              {/* TIME */}

              <div className="study-form-row">

                <div className="study-form-group">

                  <label htmlFor="study-start">
                    Start Time
                  </label>

                  <input
                    id="study-start"
                    name="startTime"
                    type="time"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="study-form-group">

                  <label htmlFor="study-end">
                    End Time
                  </label>

                  <input
                    id="study-end"
                    name="endTime"
                    type="time"
                    value={
                      form.endTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

              </div>

              {/* ACTIONS */}

              <div className="study-form-actions">

                <button
                  type="button"
                  className="study-cancel-button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="study-save-button"
                  disabled={
                    saving ||
                    subjects.length ===
                      0
                  }
                >
                  {saving ? (
                    <>
                      <span className="study-button-spinner" />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />

                      Add Study Task
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}