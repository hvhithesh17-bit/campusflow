import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  assignmentsAPI,
  subjectsAPI,
} from "../../services/api";

import "./Assignments.css";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateOnly(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

function isOverdue(assignment) {
  if (assignment.status === "completed") {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const due = getDateOnly(
    assignment.dueDate
  );

  if (!due) {
    return false;
  }

  return due < today;
}

function getDueLabel(assignment) {
  if (assignment.status === "completed") {
    return "Completed";
  }

  if (isOverdue(assignment)) {
    return "Overdue";
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const due = getDateOnly(
    assignment.dueDate
  );

  if (!due) {
    return "No due date";
  }

  const difference = Math.ceil(
    (due - today) /
      (1000 * 60 * 60 * 24)
  );

  if (difference === 0) {
    return "Due today";
  }

  if (difference === 1) {
    return "Due tomorrow";
  }

  return `Due in ${difference} days`;
}

function getPriorityClass(priority) {
  return String(priority || "medium")
    .toLowerCase();
}

/* =========================================================
   NORMALIZE ASSIGNMENT
========================================================= */

function normalizeAssignment(item) {
  const subject =
    item.subject || {};

  return {
    id:
      item._id ||
      item.id,

    title:
      item.title || "",

    subjectId:
      subject._id ||
      subject.id ||
      item.subjectId ||
      "",

    subject:
      subject.name ||
      item.subjectName ||
      "Unknown Subject",

    subjectCode:
      subject.code ||
      "",

    description:
      item.description || "",

    dueDate:
      item.dueDate
        ? String(item.dueDate).slice(0, 10)
        : "",

    priority:
      String(
        item.priority || "medium"
      ).toLowerCase(),

    status:
      item.status || "pending",
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Assignments() {
  const [subjects, setSubjects] =
    useState([]);

  const [assignments, setAssignments] =
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

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState({
      title: "",
      subjectId: "",
      description: "",
      dueDate: "",
      priority: "medium",
    });

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        subjectsResponse,
        assignmentsResponse,
      ] = await Promise.all([
        subjectsAPI.getAll(),
        assignmentsAPI.getAll(),
      ]);

      /*
       * Subjects API
       */

      const subjectData =
        subjectsResponse?.data ||
        subjectsResponse?.subjects ||
        subjectsResponse ||
        [];

      const loadedSubjects =
        Array.isArray(subjectData)
          ? subjectData
          : [];

      setSubjects(
        loadedSubjects
      );

      /*
       * Assignments API
       */

      const assignmentData =
        assignmentsResponse?.data ||
        assignmentsResponse?.assignments ||
        assignmentsResponse ||
        [];

      const loadedAssignments =
        Array.isArray(
          assignmentData
        )
          ? assignmentData.map(
              normalizeAssignment
            )
          : [];

      setAssignments(
        loadedAssignments
      );

      /*
       * Default subject for form
       */

      if (
        loadedSubjects.length > 0
      ) {
        setForm((current) => ({
          ...current,
          subjectId:
            current.subjectId ||
            loadedSubjects[0]._id ||
            loadedSubjects[0].id,
        }));
      }
    } catch (err) {
      console.error(
        "ASSIGNMENTS LOAD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FILTERED ASSIGNMENTS
  ======================================================= */

  const filteredAssignments =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return assignments.filter(
        (assignment) => {
          const matchesSearch =
            !searchValue ||
            assignment.title
              .toLowerCase()
              .includes(searchValue) ||
            assignment.subject
              .toLowerCase()
              .includes(searchValue);

          const matchesSubject =
            subjectFilter ===
              "All Subjects" ||
            assignment.subjectId ===
              subjectFilter;

          const matchesStatus =
            statusFilter === "All" ||
            (statusFilter ===
              "Pending" &&
              assignment.status ===
                "pending") ||
            (statusFilter ===
              "Completed" &&
              assignment.status ===
                "completed") ||
            (statusFilter ===
              "Overdue" &&
              isOverdue(assignment));

          return (
            matchesSearch &&
            matchesSubject &&
            matchesStatus
          );
        }
      );
    }, [
      assignments,
      search,
      subjectFilter,
      statusFilter,
    ]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const pendingCount =
    assignments.filter(
      (item) =>
        item.status === "pending"
    ).length;

  const completedCount =
    assignments.filter(
      (item) =>
        item.status === "completed"
    ).length;

  const overdueCount =
    assignments.filter((item) =>
      isOverdue(item)
    ).length;

  const dueSoonCount =
    assignments.filter((item) => {
      if (
        item.status ===
          "completed" ||
        isOverdue(item)
      ) {
        return false;
      }

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const due =
        getDateOnly(
          item.dueDate
        );

      if (!due) {
        return false;
      }

      const difference =
        Math.ceil(
          (due - today) /
            (1000 *
              60 *
              60 *
              24)
        );

      return (
        difference >= 0 &&
        difference <= 3
      );
    }).length;

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    };

  /* =======================================================
     OPEN FORM
  ======================================================= */

  const openForm = () => {
    setError("");

    setForm({
      title: "",
      subjectId:
        subjects[0]?._id ||
        subjects[0]?.id ||
        "",
      description: "",
      dueDate: "",
      priority: "medium",
    });

    setShowForm(true);
  };

  /* =======================================================
     ADD ASSIGNMENT
  ======================================================= */

  const addAssignment =
    async (event) => {
      event.preventDefault();

      if (
        !form.title.trim()
      ) {
        setError(
          "Please enter an assignment title."
        );
        return;
      }

      if (!form.subjectId) {
        setError(
          "Please select a subject."
        );
        return;
      }

      if (!form.dueDate) {
        setError(
          "Please select a due date."
        );
        return;
      }

      try {
        setSaving(true);
        setError("");

        const response =
          await assignmentsAPI.create({
            subjectId:
              form.subjectId,

            title:
              form.title.trim(),

            description:
              form.description.trim(),

            dueDate:
              form.dueDate,

            priority:
              form.priority,
          });

        const created =
          response?.assignment ||
          response?.data ||
          response;

        if (created) {
          setAssignments(
            (current) => [
              normalizeAssignment(
                created
              ),
              ...current,
            ]
          );
        }

        setShowForm(false);

        setForm({
          title: "",
          subjectId:
            subjects[0]?._id ||
            subjects[0]?.id ||
            "",
          description: "",
          dueDate: "",
          priority: "medium",
        });
      } catch (err) {
        console.error(
          "CREATE ASSIGNMENT ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to create assignment."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     TOGGLE COMPLETE
  ======================================================= */

  const toggleComplete =
    async (assignment) => {
      try {
        setError("");

        const newStatus =
          assignment.status ===
          "completed"
            ? "pending"
            : "completed";

        await assignmentsAPI.update(
          assignment.id,
          {
            status: newStatus,
          }
        );

        setAssignments(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                assignment.id
                  ? {
                      ...item,
                      status:
                        newStatus,
                    }
                  : item
            )
        );
      } catch (err) {
        console.error(
          "UPDATE ASSIGNMENT ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to update assignment."
        );
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteAssignment =
    async (id) => {
      const confirmed =
        window.confirm(
          "Delete this assignment?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await assignmentsAPI.delete(
          id
        );

        setAssignments(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id
            )
        );
      } catch (err) {
        console.error(
          "DELETE ASSIGNMENT ERROR:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete assignment."
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="assignments-page">
        <div className="assignment-loading">
          <div className="assignment-spinner" />
          <p>
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="assignments-page">

      {/* HEADER */}

      <section className="assignments-header">

        <div>
          <div className="assignments-eyebrow">
            <ClipboardList size={16} />
            Academic Work
          </div>

          <h1>
            Assignments
          </h1>

          <p>
            Keep track of your academic
            tasks and deadlines.
          </p>
        </div>

        <button
          type="button"
          className="assignments-add-button"
          onClick={openForm}
          disabled={
            subjects.length === 0
          }
        >
          <Plus size={18} />
          Add Assignment
        </button>

      </section>

      {/* ERROR */}

      {error && (
        <div className="assignment-error">

          <AlertCircle size={18} />

          <span>{error}</span>

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

      {/* SUMMARY */}

      <section className="assignment-summary">

        <div className="assignment-summary-card">
          <div className="assignment-summary-icon blue">
            <ClipboardList size={19} />
          </div>

          <div>
            <span>Total</span>
            <strong>
              {assignments.length}
            </strong>
          </div>
        </div>

        <div className="assignment-summary-card">
          <div className="assignment-summary-icon orange">
            <Clock3 size={19} />
          </div>

          <div>
            <span>Pending</span>
            <strong>
              {pendingCount}
            </strong>
          </div>
        </div>

        <div className="assignment-summary-card">
          <div className="assignment-summary-icon red">
            <AlertCircle size={19} />
          </div>

          <div>
            <span>Overdue</span>
            <strong>
              {overdueCount}
            </strong>
          </div>
        </div>

        <div className="assignment-summary-card">
          <div className="assignment-summary-icon green">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Completed</span>
            <strong>
              {completedCount}
            </strong>
          </div>
        </div>

      </section>

      {/* FILTERS */}

      <section className="assignment-toolbar">

        <div className="assignment-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search assignments..."
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
            (subject) => {
              const id =
                subject._id ||
                subject.id;

              return (
                <option
                  key={id}
                  value={id}
                >
                  {subject.name}
                  {subject.code
                    ? ` (${subject.code})`
                    : ""}
                </option>
              );
            }
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

          <option value="Overdue">
            Overdue
          </option>
        </select>

      </section>

      {/* DUE SOON */}

      {dueSoonCount > 0 && (
        <div className="assignment-notice">

          <div className="assignment-notice-icon">
            <AlertCircle size={18} />
          </div>

          <div>
            <strong>
              {dueSoonCount} assignment
              {dueSoonCount > 1
                ? "s"
                : ""}{" "}
              due soon
            </strong>

            <span>
              Make sure you complete
              your upcoming work
              before the deadline.
            </span>
          </div>

        </div>
      )}

      {/* LIST */}

      <section className="assignment-list-section">

        <div className="assignment-list-header">

          <div>
            <h2>
              {statusFilter ===
              "All"
                ? "All Assignments"
                : `${statusFilter} Assignments`}
            </h2>

            <p>
              {
                filteredAssignments.length
              }{" "}
              result
              {filteredAssignments.length !==
              1
                ? "s"
                : ""}
            </p>
          </div>

        </div>

        {filteredAssignments.length ===
        0 ? (
          <div className="assignment-empty">

            <div className="assignment-empty-icon">
              <ClipboardList size={26} />
            </div>

            <h3>
              No assignments found
            </h3>

            <p>
              {assignments.length ===
              0
                ? "You don't have any assignments yet."
                : "Try changing your filters or add a new assignment."}
            </p>

            {subjects.length >
              0 && (
              <button
                type="button"
                onClick={openForm}
              >
                <Plus size={16} />
                Add Assignment
              </button>
            )}

          </div>
        ) : (
          <div className="assignment-items">

            {filteredAssignments.map(
              (assignment) => {
                const overdue =
                  isOverdue(
                    assignment
                  );

                const completed =
                  assignment.status ===
                  "completed";

                return (
                  <article
                    className={`assignment-card ${
                      completed
                        ? "completed"
                        : ""
                    }`}
                    key={
                      assignment.id
                    }
                  >

                    {/* CHECK */}

                    <button
                      type="button"
                      className={`assignment-check ${
                        completed
                          ? "checked"
                          : ""
                      }`}
                      onClick={() =>
                        toggleComplete(
                          assignment
                        )
                      }
                      aria-label={
                        completed
                          ? "Mark as pending"
                          : "Mark as completed"
                      }
                    >
                      {completed && (
                        <Check size={15} />
                      )}
                    </button>

                    {/* CONTENT */}

                    <div className="assignment-card-content">

                      <div className="assignment-card-top">

                        <span className="assignment-subject">
                          {assignment.subject}
                          {assignment.subjectCode
                            ? ` • ${assignment.subjectCode}`
                            : ""}
                        </span>

                        <span
                          className={`assignment-priority ${getPriorityClass(
                            assignment.priority
                          )}`}
                        >
                          {assignment.priority}
                        </span>

                      </div>

                      <h3>
                        {assignment.title}
                      </h3>

                      {assignment.description && (
                        <p>
                          {
                            assignment.description
                          }
                        </p>
                      )}

                      <div className="assignment-card-meta">

                        <span
                          className={
                            overdue
                              ? "overdue"
                              : completed
                              ? "completed-date"
                              : ""
                          }
                        >
                          <CalendarDays
                            size={14}
                          />

                          {formatDate(
                            assignment.dueDate
                          )}
                        </span>

                        <span
                          className={
                            overdue
                              ? "overdue"
                              : completed
                              ? "completed-date"
                              : ""
                          }
                        >
                          {completed ? (
                            <CheckCircle2
                              size={14}
                            />
                          ) : overdue ? (
                            <AlertCircle
                              size={14}
                            />
                          ) : (
                            <Clock3
                              size={14}
                            />
                          )}

                          {getDueLabel(
                            assignment
                          )}
                        </span>

                      </div>

                    </div>

                    {/* DELETE */}

                    <button
                      type="button"
                      className="assignment-delete"
                      onClick={() =>
                        deleteAssignment(
                          assignment.id
                        )
                      }
                      aria-label="Delete assignment"
                    >
                      <Trash2 size={16} />
                    </button>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* ADD MODAL */}

      {showForm && (
        <div
          className="assignment-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowForm(false);
            }
          }}
        >

          <div
            className="assignment-modal"
            role="dialog"
            aria-modal="true"
          >

            <div className="assignment-modal-header">

              <div>
                <h2>
                  Add Assignment
                </h2>

                <p>
                  Add a new academic
                  task.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                aria-label="Close"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                addAssignment
              }
            >

              {/* TITLE */}

              <div className="assignment-form-group">

                <label htmlFor="assignment-title">
                  Assignment Title
                </label>

                <input
                  id="assignment-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Python Functions"
                  value={form.title}
                  onChange={
                    handleFormChange
                  }
                  required
                />

              </div>

              {/* SUBJECT + PRIORITY */}

              <div className="assignment-form-row">

                <div className="assignment-form-group">

                  <label htmlFor="assignment-subject">
                    Subject
                  </label>

                  <select
                    id="assignment-subject"
                    name="subjectId"
                    value={
                      form.subjectId
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map(
                      (subject) => {
                        const id =
                          subject._id ||
                          subject.id;

                        return (
                          <option
                            key={id}
                            value={id}
                          >
                            {
                              subject.name
                            }
                            {subject.code
                              ? ` (${subject.code})`
                              : ""}
                          </option>
                        );
                      }
                    )}
                  </select>

                </div>

                <div className="assignment-form-group">

                  <label htmlFor="assignment-priority">
                    Priority
                  </label>

                  <select
                    id="assignment-priority"
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="high">
                      High
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="low">
                      Low
                    </option>
                  </select>

                </div>

              </div>

              {/* DUE DATE */}

              <div className="assignment-form-group">

                <label htmlFor="assignment-due">
                  Due Date
                </label>

                <input
                  id="assignment-due"
                  name="dueDate"
                  type="date"
                  value={
                    form.dueDate
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                />

              </div>

              {/* DESCRIPTION */}

              <div className="assignment-form-group">

                <label htmlFor="assignment-description">
                  Description
                  <span>
                    Optional
                  </span>
                </label>

                <textarea
                  id="assignment-description"
                  name="description"
                  placeholder="Add some details..."
                  value={
                    form.description
                  }
                  onChange={
                    handleFormChange
                  }
                  rows={4}
                />

              </div>

              {/* ACTIONS */}

              <div className="assignment-form-actions">

                <button
                  type="button"
                  className="assignment-cancel-button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="assignment-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Plus size={17} />
                      Add Assignment
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