import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Clock3,
  MapPin,
  User,
  Plus,
  X,
  Trash2,
  Pencil,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import {
  subjectsAPI,
  timetableAPI,
} from "../../services/api";

import { useAuth } from "../../context/AuthContext";

import "./Timetable.css";

/* =========================================================
   DAYS
========================================================= */

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* =========================================================
   COLORS
========================================================= */

const COLORS = [
  "blue",
  "purple",
  "green",
  "orange",
  "pink",
  "teal",
];

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
  subjectId: "",
  day: "Monday",
  startTime: "09:30",
  endTime: "10:30",
  room: "",
  faculty: "",
  type: "Lecture",
};

/* =========================================================
   HELPERS
========================================================= */

function getResponseData(response) {
  return response?.data ?? response ?? {};
}

function getArrayFromResponse(response, possibleKeys = []) {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizeSubject(subject) {
  return {
    ...subject,

    id:
      subject?._id ||
      subject?.id,

    name:
      subject?.name ||
      subject?.subjectName ||
      "Unnamed Subject",

    code:
      subject?.code ||
      subject?.subjectCode ||
      "",

    faculty:
      subject?.faculty ||
      subject?.teacher ||
      subject?.facultyName ||
      "",

    credits:
      subject?.credits ?? 0,
  };
}

function normalizeClass(item) {
  const subject =
    item?.subjectId && typeof item.subjectId === "object"
      ? item.subjectId
      : null;

  return {
    ...item,

    id:
      item?._id ||
      item?.id,

    subjectId:
      subject?._id ||
      subject?.id ||
      item?.subjectId,

    subjectName:
      subject?.name ||
      item?.subjectName ||
      item?.subject?.name ||
      "Subject",

    subjectCode:
      subject?.code ||
      item?.subjectCode ||
      item?.subject?.code ||
      "",

    faculty:
      item?.faculty ||
      subject?.faculty ||
      "",

    day:
      item?.day ||
      "Monday",

    startTime:
      item?.startTime ||
      item?.start ||
      "09:30",

    endTime:
      item?.endTime ||
      item?.end ||
      "10:30",

    room:
      item?.room ||
      item?.location ||
      "",

    type:
      item?.type ||
      "Lecture",
  };
}

function timeToMinutes(time) {
  if (!time) {
    return 0;
  }

  const [hours, minutes] =
    String(time)
      .split(":")
      .map(Number);

  return hours * 60 + minutes;
}

function formatTime(time) {
  if (!time) {
    return "";
  }

  const [hours, minutes] =
    String(time)
      .split(":")
      .map(Number);

  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Timetable() {
  const { user } = useAuth();

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [subjects, setSubjects] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [selectedDay, setSelectedDay] =
    useState("Monday");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingClass, setEditingClass] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  /* =======================================================
     LOAD SUBJECTS
  ======================================================= */

  const loadSubjects = useCallback(
    async () => {
      try {
        const response =
          await subjectsAPI.getAll();

        const data =
          getArrayFromResponse(
            response,
            [
              "subjects",
              "data",
              "results",
            ]
          );

        const normalized =
          data.map(normalizeSubject);

        setSubjects(normalized);

        return normalized;
      } catch (err) {
        console.error(
          "Failed to load subjects:",
          err
        );

        throw err;
      }
    },
    []
  );

  /* =======================================================
     LOAD TIMETABLE
  ======================================================= */

  const loadTimetable =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          subjectResponse,
          timetableResponse,
        ] = await Promise.all([
          subjectsAPI.getAll(),
          timetableAPI.getAll(),
        ]);

        /* -----------------------------------------------
           SUBJECTS
        ----------------------------------------------- */

        const subjectData =
          getArrayFromResponse(
            subjectResponse,
            [
              "subjects",
              "data",
              "results",
            ]
          );

        const normalizedSubjects =
          subjectData.map(
            normalizeSubject
          );

        setSubjects(
          normalizedSubjects
        );

        /* -----------------------------------------------
           TIMETABLE
        ----------------------------------------------- */

        const timetableData =
          getArrayFromResponse(
            timetableResponse,
            [
              "timetable",
              "timetables",
              "classes",
              "data",
              "results",
            ]
          );

        setClasses(
          timetableData.map(
            normalizeClass
          )
        );
      } catch (err) {
        console.error(
          "Timetable loading error:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load timetable.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  /* =======================================================
     SUBJECT LOOKUP
  ======================================================= */

  const subjectMap = useMemo(() => {
    const map = new Map();

    subjects.forEach((subject) => {
      map.set(
        String(subject.id),
        subject
      );
    });

    return map;
  }, [subjects]);

  /* =======================================================
     SELECTED DAY CLASSES
  ======================================================= */

  const selectedDayClasses =
    useMemo(() => {
      return classes
        .filter(
          (item) =>
            String(item.day)
              .toLowerCase() ===
            selectedDay.toLowerCase()
        )
        .sort(
          (a, b) =>
            timeToMinutes(
              a.startTime
            ) -
            timeToMinutes(
              b.startTime
            )
        );
    }, [
      classes,
      selectedDay,
    ]);

  /* =======================================================
     TOTAL CLASSES
  ======================================================= */

  const totalClasses =
    classes.length;

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  const openCreateModal =
    async () => {
      setError("");

      let currentSubjects =
        subjects;

      if (
        currentSubjects.length === 0
      ) {
        try {
          currentSubjects =
            await loadSubjects();
        } catch {
          setError(
            "Unable to load subjects. Please check the Subjects page."
          );

          return;
        }
      }

      if (
        currentSubjects.length === 0
      ) {
        setError(
          "Add a subject first before creating a timetable class."
        );

        return;
      }

      setEditingClass(null);

      setForm({
        ...EMPTY_FORM,
        subjectId:
          currentSubjects[0]?.id ||
          "",
      });

      setShowModal(true);
    };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditModal =
    (item) => {
      setError("");

      setEditingClass(item);

      setForm({
        subjectId:
          item.subjectId ||
          "",
        day:
          item.day ||
          "Monday",
        startTime:
          item.startTime ||
          "09:30",
        endTime:
          item.endTime ||
          "10:30",
        room:
          item.room ||
          "",
        faculty:
          item.faculty ||
          "",
        type:
          item.type ||
          "Lecture",
      });

      setShowModal(true);
    };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setShowModal(false);
      setEditingClass(null);
      setForm(EMPTY_FORM);
    };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm((previous) => ({
        ...previous,
        [name]: value,
      }));

      if (error) {
        setError("");
      }
    };

  /* =======================================================
     SAVE CLASS
  ======================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");

      if (!form.subjectId) {
        setError(
          "Please select a subject."
        );

        return;
      }

      if (!form.day) {
        setError(
          "Please select a day."
        );

        return;
      }

      if (!form.startTime) {
        setError(
          "Please enter a start time."
        );

        return;
      }

      if (!form.endTime) {
        setError(
          "Please enter an end time."
        );

        return;
      }

      if (
        timeToMinutes(
          form.endTime
        ) <=
        timeToMinutes(
          form.startTime
        )
      ) {
        setError(
          "End time must be after start time."
        );

        return;
      }

      const selectedSubject =
        subjectMap.get(
          String(form.subjectId)
        );

      if (!selectedSubject) {
        setError(
          "Selected subject could not be found."
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          subjectId:
            selectedSubject.id,

          day:
            form.day,

          startTime:
            form.startTime,

          endTime:
            form.endTime,

          room:
            form.room.trim(),

          faculty:
            form.faculty.trim() ||
            selectedSubject.faculty ||
            "",

          type:
            form.type,

          userId:
            user?.id,
        };

        let response;

        if (editingClass?.id) {
          response =
            await timetableAPI.update(
              editingClass.id,
              payload
            );
        } else {
          response =
            await timetableAPI.create(
              payload
            );
        }

        console.log(
          "Timetable saved:",
          response?.data
        );

        closeModal();

        await loadTimetable();
      } catch (err) {
        console.error(
          "Timetable save error:",
          err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save timetable class.";

        setError(message);
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (item) => {
      if (!item?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this timetable class?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await timetableAPI.delete(
          item.id
        );

        await loadTimetable();
      } catch (err) {
        console.error(
          "Delete timetable error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to delete timetable class."
        );
      }
    };

  /* =======================================================
     RENDER LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="timetable-page">
        <div className="timetable-skeleton-loading">
          <div className="timetable-skeleton-header">
            <div className="timetable-skeleton-icon" />
            <div className="timetable-skeleton-text long" />
            <div className="timetable-skeleton-text short" />
          </div>
          <div className="timetable-skeleton-summary">
            <div className="timetable-skeleton-text" />
            <div className="timetable-skeleton-text" />
          </div>
          <div className="timetable-skeleton-day-tabs">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="timetable-skeleton-text" />
            ))}
          </div>
          <div className="timetable-skeleton-schedule">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="timetable-skeleton-item">
                <div className="timetable-skeleton-time">
                  <div className="timetable-skeleton-text" />
                  <div className="timetable-skeleton-text short" />
                </div>
                <div className="timetable-skeleton-line">
                  <div className="timetable-skeleton-dot" />
                </div>
                <div className="timetable-skeleton-class">
                  <div className="timetable-skeleton-class-icon" />
                  <div className="timetable-skeleton-class-info">
                    <div className="timetable-skeleton-class-title">
                      <div className="timetable-skeleton-text long" />
                      <div className="timetable-skeleton-text short" />
                    </div>
                    <div className="timetable-skeleton-type" />
                    <div className="timetable-skeleton-meta">
                      <div className="timetable-skeleton-text" />
                      <div className="timetable-skeleton-text" />
                    </div>
                  </div>
                  <div className="timetable-skeleton-actions">
                    <div className="timetable-skeleton-actions" />
                    <div className="timetable-skeleton-actions" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="timetable-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="timetable-header">

        <div>
          <div className="timetable-eyebrow">
            <CalendarDays size={16} />
            Academic Planning
          </div>

          <h1>
            Timetable
          </h1>

          <p>
            Organize your weekly classes
            and stay on schedule.
          </p>
        </div>

        <button
          type="button"
          className="timetable-add-button"
          onClick={
            openCreateModal
          }
        >
          <Plus size={17} />
          Add Class
        </button>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="timetable-error">

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
            ×
          </button>

        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="timetable-summary">

        <div className="timetable-summary-main">

          <div className="timetable-summary-icon">
            <CalendarDays
              size={21}
            />
          </div>

          <div>
            <span>
              Weekly Schedule
            </span>

            <strong>
              {totalClasses}{" "}
              {totalClasses === 1
                ? "Class"
                : "Classes"}
            </strong>

            <small>
              Your current timetable
            </small>
          </div>

        </div>

        <div className="timetable-summary-stat">

          <Clock3 size={20} />

          <div>
            <span>
              Selected Day
            </span>

            <strong>
              {selectedDay}
            </strong>
          </div>

        </div>

      </section>

      {/* =================================================
          DAY CARD
      ================================================= */}

      <section className="timetable-card">

        <div className="timetable-day-header">

          <div>
            <h2>
              Weekly Timetable
            </h2>

            <p>
              Select a day to view classes
            </p>
          </div>

          <div className="timetable-mobile-arrows">

            <button
              type="button"
              onClick={() => {
                const index =
                  DAYS.indexOf(
                    selectedDay
                  );

                const previous =
                  index <= 0
                    ? DAYS.length - 1
                    : index - 1;

                setSelectedDay(
                  DAYS[previous]
                );
              }}
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                const index =
                  DAYS.indexOf(
                    selectedDay
                  );

                const next =
                  index >=
                  DAYS.length - 1
                    ? 0
                    : index + 1;

                setSelectedDay(
                  DAYS[next]
                );
              }}
            >
              <ChevronRight
                size={17}
              />
            </button>

          </div>

        </div>

        <div className="timetable-day-tabs">

          {DAYS.map(
            (day) => {
              const count =
                classes.filter(
                  (item) =>
                    item.day ===
                    day
                ).length;

              return (
                <button
                  key={day}
                  type="button"
                  className={
                    selectedDay === day
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedDay(day)
                  }
                >
                  <span className="timetable-day-full">
                    {day}
                  </span>

                  <span className="timetable-day-short">
                    {day.slice(0, 3)}
                  </span>

                  <small>
                    {count}
                  </small>
                </button>
              );
            }
          )}

        </div>

      </section>

      {/* =================================================
          SCHEDULE
      ================================================= */}

      <section className="timetable-schedule">

        <div className="timetable-schedule-header">

          <div>
            <h2>
              {selectedDay}
            </h2>

            <p>
              {selectedDayClasses.length}{" "}
              {selectedDayClasses.length ===
              1
                ? "class"
                : "classes"}{" "}
              scheduled
            </p>
          </div>

          {selectedDay ===
            new Date().toLocaleDateString(
              "en-US",
              {
                weekday:
                  "long",
              }
            ) && (
            <span className="timetable-today-badge">
              Today
            </span>
          )}

        </div>

        {selectedDayClasses.length ===
        0 ? (
          <div className="timetable-empty">

            <div className="timetable-empty-icon">
              <CalendarDays
                size={25}
              />
            </div>

            <h3>
              No classes scheduled
            </h3>

            <p>
              There are no classes
              scheduled for{" "}
              {selectedDay}.
            </p>

            <button
              type="button"
              onClick={
                openCreateModal
              }
            >
              <Plus size={14} />
              Add Class
            </button>

          </div>
        ) : (
          <div className="timetable-list">

            {selectedDayClasses.map(
              (item, index) => {
                const color =
                  COLORS[
                    index %
                      COLORS.length
                  ];

                return (
                  <article
                    className="timetable-item"
                    key={
                      item.id ||
                      `${item.day}-${item.startTime}-${index}`
                    }
                  >

                    {/* TIME */}

                    <div className="timetable-time">

                      <strong>
                        {formatTime(
                          item.startTime
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          item.endTime
                        )}
                      </span>

                    </div>

                    {/* TIMELINE */}

                    <div className="timetable-line">

                      <div
                        className={`timetable-dot ${color}`}
                      />

                    </div>

                    {/* CLASS */}

                    <div className="timetable-class">

                      <div
                        className={`timetable-class-icon ${color}`}
                      >
                        <BookOpen
                          size={17}
                        />
                      </div>

                      <div className="timetable-class-info">

                        <div className="timetable-class-title">

                          <h3>
                            {
                              item.subjectName
                            }
                          </h3>

                          <span className="timetable-type">
                            {item.type}
                          </span>

                        </div>

                        {item.subjectCode && (
                          <span className="timetable-code">
                            {
                              item.subjectCode
                            }
                          </span>
                        )}

                        <div className="timetable-meta">

                          {item.faculty && (
                            <span>
                              <User
                                size={12}
                              />
                              {
                                item.faculty
                              }
                            </span>
                          )}

                          {item.room && (
                            <span>
                              <MapPin
                                size={12}
                              />
                              {item.room}
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="timetable-actions">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              item
                            )
                          }
                          aria-label="Edit class"
                        >
                          <Pencil
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              item
                            )
                          }
                          aria-label="Delete class"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>

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
          className="timetable-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="timetable-modal">

            <div className="timetable-modal-header">

              <div>
                <div className="timetable-modal-title-icon">
                  <CalendarDays
                    size={18}
                  />
                </div>

                <div>
                  <h2>
                    {editingClass
                      ? "Edit Class"
                      : "Add Class"}
                  </h2>

                  <p>
                    Add a class to your
                    weekly timetable.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="timetable-modal-close"
                onClick={
                  closeModal
                }
              >
                <X size={17} />
              </button>

            </div>

            <form
              className="timetable-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* SUBJECT */}

              <div className="timetable-form-group">

                <label htmlFor="subjectId">
                  Subject
                </label>

                <select
                  id="subjectId"
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
                    Select subject
                  </option>

                  {subjects.map(
                    (subject) => (
                      <option
                        key={
                          subject.id
                        }
                        value={
                          subject.id
                        }
                      >
                        {subject.name}
                        {subject.code
                          ? ` (${subject.code})`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* DAY */}

              <div className="timetable-form-group">

                <label htmlFor="day">
                  Day
                </label>

                <select
                  id="day"
                  name="day"
                  value={
                    form.day
                  }
                  onChange={
                    handleChange
                  }
                >
                  {DAYS.map(
                    (day) => (
                      <option
                        key={day}
                        value={day}
                      >
                        {day}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* TIME */}

              <div className="timetable-form-row">

                <div className="timetable-form-group">

                  <label htmlFor="startTime">
                    Start Time
                  </label>

                  <input
                    id="startTime"
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

                <div className="timetable-form-group">

                  <label htmlFor="endTime">
                    End Time
                  </label>

                  <input
                    id="endTime"
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

              {/* ROOM */}

              <div className="timetable-form-group">

                <label htmlFor="room">
                  Room / Location
                </label>

                <input
                  id="room"
                  name="room"
                  type="text"
                  placeholder="Example: Room 204"
                  value={
                    form.room
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* FACULTY */}

              <div className="timetable-form-group">

                <label htmlFor="faculty">
                  Faculty
                </label>

                <input
                  id="faculty"
                  name="faculty"
                  type="text"
                  placeholder="Faculty name"
                  value={
                    form.faculty
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* TYPE */}

              <div className="timetable-form-group">

                <label htmlFor="type">
                  Class Type
                </label>

                <select
                  id="type"
                  name="type"
                  value={
                    form.type
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="Lecture">
                    Lecture
                  </option>

                  <option value="Lab">
                    Lab
                  </option>

                  <option value="Tutorial">
                    Tutorial
                  </option>

                  <option value="Seminar">
                    Seminar
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>

              </div>

              {/* ACTIONS */}

              <div className="timetable-form-actions">

                <button
                  type="button"
                  className="timetable-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="timetable-save-button"
                  disabled={
                    saving ||
                    subjects.length ===
                      0
                  }
                >
                  {saving ? (
                    <>
                      <span className="timetable-button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus
                        size={14}
                      />
                      {editingClass
                        ? "Update Class"
                        : "Add Class"}
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