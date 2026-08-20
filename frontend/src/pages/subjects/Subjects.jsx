import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  GraduationCap,
  Users,
  Plus,
  X,
  Trash2,
  Pencil,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

import { subjectsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "./Subjects.css";

/* =========================================================
   COLORS
========================================================= */

const SUBJECT_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#16a34a",
  "#ea580c",
  "#db2777",
  "#0891b2",
];

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
  name: "",
  code: "",
  credits: "",
  faculty: "",
  color: "#2563eb",
};

/* =========================================================
   NORMALIZE SUBJECT
========================================================= */

function normalizeSubject(subject) {
  if (!subject) {
    return null;
  }

  return {
    id:
      subject._id ||
      subject.id ||
      "",

    name:
      subject.name ||
      "Unnamed Subject",

    code:
      subject.code ||
      "",

    credits:
      Number(subject.credits) || 0,

    faculty:
      subject.faculty ||
      "",

    color:
      subject.color ||
      "#2563eb",

    attendance:
      subject.attendance !== undefined
        ? Number(subject.attendance)
        : null,

    attended:
      subject.attended !== undefined
        ? Number(subject.attended)
        : null,

    totalClasses:
      subject.totalClasses !== undefined
        ? Number(subject.totalClasses)
        : null,

    internal:
      subject.internal !== undefined
        ? Number(subject.internal)
        : null,

    maxInternal:
      subject.maxInternal !== undefined
        ? Number(subject.maxInternal)
        : null,
  };
}

/* =========================================================
   GET SUBJECTS FROM FETCH RESPONSE
========================================================= */

function getSubjectsFromResponse(response) {
  /*
    IMPORTANT:

    api.js is using fetch(), so response is already
    the parsed JSON object.

    Example:

    {
      success: true,
      subjects: [...]
    }
  */

  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response.subjects
    )
  ) {
    return response.subjects;
  }

  if (
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response.results
    )
  ) {
    return response.results;
  }

  return [];
}

/* =========================================================
   ATTENDANCE STATUS
========================================================= */

function getAttendanceStatus(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (value >= 85) {
    return "good";
  }

  if (value >= 75) {
    return "warning";
  }

  return "danger";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Subjects() {
  const { user } = useAuth();

  /* =======================================================
     STATE
  ======================================================= */

  const [subjects, setSubjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingSubject, setEditingSubject] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  /* =======================================================
     LOAD SUBJECTS
  ======================================================= */

  const loadSubjects =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await subjectsAPI.getAll();

        /*
          FETCH RESPONSE

          response =
          {
            success: true,
            subjects: [...]
          }
        */

        console.log(
          "SUBJECTS API RESPONSE:",
          response
        );

        const apiSubjects =
          getSubjectsFromResponse(
            response
          );

        console.log(
          "MONGODB SUBJECTS:",
          apiSubjects
        );

        const cleanSubjects =
          apiSubjects
            .filter(Boolean)
            .map(
              normalizeSubject
            )
            .filter(Boolean);

        setSubjects(
          cleanSubjects
        );
      } catch (err) {
        console.error(
          "Subjects loading error:",
          err
        );

        setSubjects([]);

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Unable to load subjects."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  /* =======================================================
     TOTAL CREDITS
  ======================================================= */

  const totalCredits =
    useMemo(() => {
      return subjects.reduce(
        (total, subject) =>
          total +
          (Number(
            subject?.credits
          ) || 0),
        0
      );
    }, [subjects]);

  /* =======================================================
     ATTENDANCE
  ======================================================= */

  const subjectsWithAttendance =
    useMemo(() => {
      return subjects.filter(
        (subject) =>
          subject?.attendance !==
            null &&
          subject?.attendance !==
            undefined
      );
    }, [subjects]);

  const averageAttendance =
    useMemo(() => {
      if (
        subjectsWithAttendance.length ===
        0
      ) {
        return null;
      }

      const total =
        subjectsWithAttendance.reduce(
          (sum, subject) =>
            sum +
            (Number(
              subject?.attendance
            ) || 0),
          0
        );

      return Math.round(
        total /
          subjectsWithAttendance.length
      );
    }, [
      subjectsWithAttendance,
    ]);

  /* =======================================================
     ADD SUBJECT
  ======================================================= */

  const openAddModal = () => {
    setError("");

    setEditingSubject(null);

    setForm({
      ...EMPTY_FORM,
      color:
        SUBJECT_COLORS[
          subjects.length %
            SUBJECT_COLORS.length
        ],
    });

    setShowModal(true);
  };

  /* =======================================================
     EDIT SUBJECT
  ======================================================= */

  const openEditModal = (
    subject
  ) => {
    setError("");

    setEditingSubject(
      subject
    );

    setForm({
      name:
        subject?.name || "",

      code:
        subject?.code || "",

      credits:
        subject?.credits ??
        "",

      faculty:
        subject?.faculty || "",

      color:
        subject?.color ||
        "#2563eb",
    });

    setShowModal(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingSubject(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

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
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    if (error) {
      setError("");
    }
  };

  /* =======================================================
     SAVE SUBJECT
  ======================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");

      const name =
        form.name.trim();

      const code =
        form.code.trim();

      const faculty =
        form.faculty.trim();

      const credits =
        Number(form.credits);

      if (!name) {
        setError(
          "Please enter the subject name."
        );

        return;
      }

      if (
        form.credits === "" ||
        Number.isNaN(credits)
      ) {
        setError(
          "Please enter valid credits."
        );

        return;
      }

      if (
        credits < 0 ||
        credits > 20
      ) {
        setError(
          "Credits must be between 0 and 20."
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          name,
          code,
          credits,
          faculty,
          color:
            form.color ||
            "#2563eb",
        };

        console.log(
          "SUBJECT PAYLOAD:",
          payload
        );

        if (
          editingSubject?.id
        ) {
          await subjectsAPI.update(
            editingSubject.id,
            payload
          );
        } else {
          await subjectsAPI.create(
            payload
          );
        }

        setShowModal(false);
        setEditingSubject(null);

        setForm({
          ...EMPTY_FORM,
        });

        await loadSubjects();
      } catch (err) {
        console.error(
          "Save subject error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Unable to save subject."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (subject) => {
      if (!subject?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${subject.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          subject.id
        );

        setError("");

        await subjectsAPI.delete(
          subject.id
        );

        await loadSubjects();
      } catch (err) {
        console.error(
          "Delete subject error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Unable to delete subject."
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="subjects-page">
        <div className="subjects-loading">
          <div className="subjects-spinner" />

          <p>
            Loading your subjects...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="subjects-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="subjects-header">

        <div>

          <div className="subjects-eyebrow">
            <BookOpen
              size={16}
            />

            Academic
          </div>

          <h1>
            Subjects
          </h1>

          <p>
            Manage your semester subjects
            and track academic progress.
          </p>

        </div>

        <button
          type="button"
          className="subjects-add-button"
          onClick={
            openAddModal
          }
        >
          <Plus size={18} />

          Add Subject
        </button>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="subjects-error">

          <AlertCircle
            size={18}
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
            <X size={16} />
          </button>

        </div>
      )}

      {/* =================================================
          SEMESTER
      ================================================= */}

      <section className="semester-banner">

        <div className="semester-banner-icon">
          <GraduationCap
            size={23}
          />
        </div>

        <div className="semester-banner-info">

          <span>
            Current Semester
          </span>

          <strong>
            Semester{" "}
            {user?.semester ||
              "—"}
          </strong>

          <small>
            {user?.branch ||
              "Your Branch"}
          </small>

          <small>
            {user?.college ||
              ""}
          </small>

        </div>

        <div className="semester-banner-stats">

          <div>
            <strong>
              {subjects.length}
            </strong>

            <span>
              Subjects
            </span>
          </div>

          <div>
            <strong>
              {totalCredits}
            </strong>

            <span>
              Credits
            </span>
          </div>

          <div>
            <strong>
              {averageAttendance !==
              null
                ? `${averageAttendance}%`
                : "--"}
            </strong>

            <span>
              Attendance
            </span>
          </div>

        </div>

      </section>

      {/* =================================================
          SUBJECTS
      ================================================= */}

      <section className="subjects-section">

        <div className="subjects-section-header">

          <div>
            <h2>
              Your Subjects
            </h2>

            <p>
              Semester{" "}
              {user?.semester ||
                "—"}{" "}
              subjects
            </p>
          </div>

          <span className="subjects-count">
            {subjects.length}{" "}
            {subjects.length === 1
              ? "subject"
              : "subjects"}
          </span>

        </div>

        {/* EMPTY */}

        {subjects.length ===
        0 ? (
          <div className="subjects-empty">

            <div className="subjects-empty-icon">
              <BookOpen
                size={27}
              />
            </div>

            <h3>
              No subjects yet
            </h3>

            <p>
              Add your semester subjects
              to start tracking attendance,
              assignments and academic
              progress.
            </p>

            <button
              type="button"
              className="subjects-add-button"
              onClick={
                openAddModal
              }
            >
              <Plus size={16} />

              Add Your First Subject
            </button>

          </div>
        ) : (
          <div className="subjects-grid">

            {subjects.map(
              (
                subject,
                index
              ) => {

                const attendance =
                  subject?.attendance;

                const attendanceStatus =
                  getAttendanceStatus(
                    attendance
                  );

                const hasAttendance =
                  attendance !==
                    null &&
                  attendance !==
                    undefined;

                const internal =
                  subject?.internal;

                const maxInternal =
                  subject?.maxInternal;

                const hasInternal =
                  internal !==
                    null &&
                  internal !==
                    undefined &&
                  maxInternal;

                const internalPercentage =
                  hasInternal
                    ? Math.round(
                        (Number(
                          internal
                        ) /
                          Number(
                            maxInternal
                          )) *
                          100
                      )
                    : null;

                return (
                  <article
                    className="subject-card"
                    key={
                      subject?.id ||
                      `subject-${index}`
                    }
                  >

                    {/* TOP */}

                    <div className="subject-card-top">

                      <div
                        className="subject-icon"
                        style={{
                          background:
                            `${
                              subject?.color ||
                              "#2563eb"
                            }18`,

                          color:
                            subject?.color ||
                            "#2563eb",
                        }}
                      >
                        <BookOpen
                          size={21}
                        />
                      </div>

                      <div className="subject-credits">
                        {subject?.credits ||
                          0}{" "}
                        {Number(
                          subject?.credits
                        ) === 1
                          ? "Credit"
                          : "Credits"}
                      </div>

                    </div>

                    {/* INFO */}

                    <div className="subject-main">

                      <span className="subject-code">
                        {subject?.code ||
                          "NO CODE"}
                      </span>

                      <h3>
                        {subject?.name ||
                          "Unnamed Subject"}
                      </h3>

                      {subject?.faculty && (
                        <div className="subject-faculty">

                          <Users
                            size={14}
                          />

                          <span>
                            {
                              subject.faculty
                            }
                          </span>

                        </div>
                      )}

                    </div>

                    {/* ATTENDANCE */}

                    <div className="subject-metric">

                      <div className="subject-metric-header">

                        <div>

                          <span>
                            Attendance
                          </span>

                          <small>
                            {hasAttendance
                              ? `${subject?.attended || 0}/${subject?.totalClasses || 0}`
                              : "Not marked yet"}
                          </small>

                        </div>

                        <strong
                          className={
                            attendanceStatus
                          }
                        >
                          {hasAttendance
                            ? `${attendance}%`
                            : "--"}
                        </strong>

                      </div>

                      <div className="subject-progress">

                        <div
                          className={
                            attendanceStatus
                          }
                          style={{
                            width:
                              hasAttendance
                                ? `${Math.min(
                                    Math.max(
                                      attendance,
                                      0
                                    ),
                                    100
                                  )}%`
                                : "0%",
                          }}
                        />

                      </div>

                    </div>

                    {/* INTERNAL */}

                    <div className="subject-metric">

                      <div className="subject-metric-header">

                        <div>

                          <span>
                            Internal Marks
                          </span>

                          <small>
                            {hasInternal
                              ? `${internal}/${maxInternal}`
                              : "Not added yet"}
                          </small>

                        </div>

                        <strong className="internal-score">
                          {internalPercentage !==
                          null
                            ? `${internalPercentage}%`
                            : "--"}
                        </strong>

                      </div>

                      <div className="subject-progress internal">

                        <div
                          style={{
                            width:
                              internalPercentage !==
                              null
                                ? `${Math.min(
                                    Math.max(
                                      internalPercentage,
                                      0
                                    ),
                                    100
                                  )}%`
                                : "0%",
                          }}
                        />

                      </div>

                    </div>

                    {/* FOOTER */}

                    <div className="subject-card-footer">

                      <div className="subject-class-info">

                        <BookOpen
                          size={14}
                        />

                        <span>
                          {subject?.credits ||
                            0}{" "}
                          Credits
                        </span>

                      </div>

                      <div className="subject-card-actions">

                        <button
                          type="button"
                          className="subject-edit-button"
                          onClick={() =>
                            openEditModal(
                              subject
                            )
                          }
                          title="Edit subject"
                        >
                          <Pencil
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          className="subject-delete-button"
                          onClick={() =>
                            handleDelete(
                              subject
                            )
                          }
                          disabled={
                            deletingId ===
                            subject?.id
                          }
                          title="Delete subject"
                        >
                          {deletingId ===
                          subject?.id ? (
                            <span className="subject-button-spinner" />
                          ) : (
                            <Trash2
                              size={14}
                            />
                          )}
                        </button>

                        <Link
                          to={`/subjects/${subject?.id}`}
                          className="subject-view-button"
                        >
                          View

                          <ArrowRight
                            size={15}
                          />
                        </Link>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =================================================
          MODAL
      ================================================= */}

      {showModal && (
        <div
          className="subjects-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="subjects-modal">

            <div className="subjects-modal-header">

              <div>

                <div className="subjects-modal-icon">
                  <BookOpen
                    size={18}
                  />
                </div>

                <div>
                  <h2>
                    {editingSubject
                      ? "Edit Subject"
                      : "Add Subject"}
                  </h2>

                  <p>
                    {editingSubject
                      ? "Update your subject details."
                      : "Add a subject to your current semester."}
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="subjects-modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <X size={18} />
              </button>

            </div>

            <form
              className="subjects-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="subjects-form-group">

                <label htmlFor="subject-name">
                  Subject Name
                </label>

                <input
                  id="subject-name"
                  name="name"
                  type="text"
                  placeholder="Example: Engineering Mathematics"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              <div className="subjects-form-group">

                <label htmlFor="subject-code">
                  Subject Code
                </label>

                <input
                  id="subject-code"
                  name="code"
                  type="text"
                  placeholder="Example: MAT201"
                  value={
                    form.code
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="subjects-form-group">

                <label htmlFor="subject-credits">
                  Credits
                </label>

                <input
                  id="subject-credits"
                  name="credits"
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  placeholder="Example: 4"
                  value={
                    form.credits
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              <div className="subjects-form-group">

                <label htmlFor="subject-faculty">
                  Faculty
                </label>

                <input
                  id="subject-faculty"
                  name="faculty"
                  type="text"
                  placeholder="Example: Dr. Priya Sharma"
                  value={
                    form.faculty
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              <div className="subjects-form-group">

                <label>
                  Subject Color
                </label>

                <div className="subjects-color-picker">

                  {SUBJECT_COLORS.map(
                    (color) => (
                      <button
                        type="button"
                        key={color}
                        className={
                          form.color ===
                          color
                            ? "selected"
                            : ""
                        }
                        style={{
                          backgroundColor:
                            color,
                        }}
                        onClick={() =>
                          setForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              color,
                            })
                          )
                        }
                      />
                    )
                  )}

                </div>

              </div>

              <div className="subjects-form-actions">

                <button
                  type="button"
                  className="subjects-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="subjects-save-button"
                  disabled={
                    saving
                  }
                >
                  {saving ? (
                    <>
                      <span className="subject-button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={15}
                      />

                      {editingSubject
                        ? "Update Subject"
                        : "Add Subject"}
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