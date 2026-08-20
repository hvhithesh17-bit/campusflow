import "./Attendance.css";
import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { attendanceAPI, subjectsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function getPercentage(attended, total) {
  if (!total) return 0;

  return Math.round(
    (attended / total) * 100
  );
}

function getStatus(percentage) {
  if (percentage >= 85) {
    return {
      label: "Good",
      className: "good",
    };
  }

  if (percentage >= 75) {
    return {
      label: "Warning",
      className: "warning",
    };
  }

  return {
    label: "Low",
    className: "danger",
  };
}

function getMissableClasses(
  attended,
  total,
  target = 75
) {
  if (total <= 0) {
    return 0;
  }

  let currentAttended = attended;
  let currentTotal = total;
  let misses = 0;

  while (
    currentTotal > 0 &&
    currentAttended / currentTotal >=
      target / 100 &&
    misses < 100
  ) {
    currentTotal += 1;

    if (
      currentAttended /
        currentTotal >=
      target / 100
    ) {
      misses += 1;
    } else {
      break;
    }
  }

  return misses;
}

function getRequiredClasses(
  attended,
  total,
  target = 75
) {
  if (total <= 0) {
    return 0;
  }

  if (
    attended / total >=
    target / 100
  ) {
    return 0;
  }

  let classes = 0;
  let currentAttended = attended;
  let currentTotal = total;

  while (
    currentAttended /
      currentTotal <
      target / 100 &&
    classes < 100
  ) {
    currentAttended += 1;
    currentTotal += 1;
    classes += 1;
  }

  return classes;
}

export default function Attendance() {
  const { user } = useAuth();

  const [subjects, setSubjects] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [selectedSubject, setSelectedSubject] =
    useState(null);

  const [calculatorMode, setCalculatorMode] =
    useState("miss");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * LOAD SUBJECTS + ATTENDANCE
   */
  useEffect(() => {
    loadAttendancePage();
  }, []);

  const loadAttendancePage = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        subjectsResponse,
        attendanceResponse,
      ] = await Promise.all([
        subjectsAPI.getAll(),
        attendanceAPI.getAll(),
      ]);

      const loadedSubjects =
        subjectsResponse.subjects || [];

      const loadedAttendance =
        attendanceResponse.attendance || [];

      setSubjects(loadedSubjects);

      setAttendance(
        loadedAttendance
      );

      /*
       * Automatically select the first
       * subject from MongoDB.
       */
      if (loadedSubjects.length > 0) {
        setSelectedSubject(
          loadedSubjects[0]._id
        );
      } else {
        setSelectedSubject(null);
      }
    } catch (err) {
      console.error(
        "Attendance loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * CREATE A COMBINED LIST
   *
   * Subjects come from MongoDB.
   * Attendance is matched using subject ID.
   */
  const attendanceSubjects =
    useMemo(() => {
      return subjects.map(
        (subject) => {
          const record =
            attendance.find(
              (item) => {
                const attendanceSubjectId =
                  item.subject?._id ||
                  item.subject;

                return (
                  String(
                    attendanceSubjectId
                  ) ===
                  String(subject._id)
                );
              }
            );

          return {
            ...subject,

            attendanceId:
              record?._id || null,

            attended:
              record?.attended || 0,

            total:
              record?.totalClasses || 0,

            percentage:
              record
                ? record.percentage ||
                  getPercentage(
                    record.attended,
                    record.totalClasses
                  )
                : 0,
          };
        }
      );
    }, [subjects, attendance]);

  /*
   * SELECTED SUBJECT
   */
  const selected =
    attendanceSubjects.find(
      (subject) =>
        String(subject._id) ===
        String(selectedSubject)
    ) || null;

  /*
   * OVERALL ATTENDANCE
   */
  const overall = useMemo(() => {
    const attended =
      attendanceSubjects.reduce(
        (sum, subject) =>
          sum + subject.attended,
        0
      );

    const total =
      attendanceSubjects.reduce(
        (sum, subject) =>
          sum + subject.total,
        0
      );

    return {
      attended,
      total,
      percentage:
        getPercentage(
          attended,
          total
        ),
    };
  }, [attendanceSubjects]);

  /*
   * MARK ATTENDANCE
   */
  const markAttendance = async (
    subject,
    present
  ) => {
    if (!subject) return;

    try {
      setSaving(true);
      setError("");

      const attended =
        subject.attended +
        (present ? 1 : 0);

      const total =
        subject.total + 1;

      const response =
        await attendanceAPI.save({
          subjectId:
            subject._id,

          attended,

          totalClasses: total,
        });

      const saved =
        response.attendance;

      setAttendance((current) => {
        const existingIndex =
          current.findIndex(
            (item) => {
              const id =
                item.subject?._id ||
                item.subject;

              return (
                String(id) ===
                String(subject._id)
              );
            }
          );

        if (existingIndex === -1) {
          return [
            ...current,
            saved,
          ];
        }

        const updated = [
          ...current,
        ];

        updated[existingIndex] =
          saved;

        return updated;
      });
    } catch (err) {
      console.error(
        "Mark attendance error:",
        err
      );

      setError(
        err.message ||
          "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * SELECT SUBJECT
   */
  const handleSelectSubject = (
    subjectId
  ) => {
    setSelectedSubject(
      subjectId
    );
  };

  /*
   * CALCULATOR VALUES
   */
  const selectedPercentage =
    selected
      ? getPercentage(
          selected.attended,
          selected.total
        )
      : 0;

  const selectedStatus =
    getStatus(
      selectedPercentage
    );

  const missableClasses =
    selected
      ? getMissableClasses(
          selected.attended,
          selected.total,
          75
        )
      : 0;

  const requiredClasses =
    selected
      ? getRequiredClasses(
          selected.attended,
          selected.total,
          75
        )
      : 0;

  /*
   * SUMMARY
   */
  const safeSubjects =
    attendanceSubjects.filter(
      (subject) =>
        subject.total > 0 &&
        subject.percentage >= 75
    ).length;

  const attentionSubjects =
    attendanceSubjects.filter(
      (subject) =>
        subject.total > 0 &&
        subject.percentage < 75
    ).length;

  const classesMissed =
    Math.max(
      0,
      overall.total -
        overall.attended
    );

  return (
    <div className="attendance-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <section className="attendance-header">

        <div>

          <div className="attendance-eyebrow">

            <CalendarCheck size={16} />

            Academic Tracking

          </div>

          <h1>
            Attendance
          </h1>

          <p>
            Track your attendance and stay
            above the required percentage.
          </p>

          {user?.semester && (
            <small>
              Semester {user.semester}
              {user.branch
                ? ` · ${user.branch}`
                : ""}
            </small>
          )}

        </div>

      </section>

      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="attendance-error">

          <AlertCircle size={17} />

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

      {/* =====================================
          LOADING
      ====================================== */}

      {loading ? (
        <section className="attendance-card">

          <div className="attendance-loading">

            <div className="attendance-spinner" />

            <span>
              Loading your subjects
              and attendance...
            </span>

          </div>

        </section>
      ) : (
        <>
          {/* =====================================
              NO SUBJECTS
          ====================================== */}

          {attendanceSubjects.length ===
          0 ? (
            <section className="attendance-card attendance-empty">

              <div className="attendance-empty-icon">
                <CalendarCheck
                  size={28}
                />
              </div>

              <h2>
                No subjects found
              </h2>

              <p>
                Add subjects first from the
                Subjects page. Your subjects
                will automatically appear here.
              </p>

            </section>
          ) : (
            <>
              {/* =================================
                  OVERVIEW
              ================================= */}

              <section className="attendance-overview">

                <div className="attendance-overview-main">

                  <div className="attendance-overview-icon">

                    <CalendarCheck
                      size={24}
                    />

                  </div>

                  <div className="attendance-overview-content">

                    <span>
                      Overall Attendance
                    </span>

                    <strong>
                      {overall.percentage}%
                    </strong>

                    <div className="attendance-overview-progress">

                      <div
                        style={{
                          width: `${overall.percentage}%`,
                        }}
                      />

                    </div>

                    <small>
                      {overall.attended} of{" "}
                      {overall.total}{" "}
                      classes attended
                    </small>

                  </div>

                </div>

                <div className="attendance-overview-target">

                  <Target size={20} />

                  <div>

                    <span>
                      Minimum required
                    </span>

                    <strong>
                      75%
                    </strong>

                  </div>

                </div>

              </section>

              {/* =================================
                  SUMMARY
              ================================= */}

              <section className="attendance-summary">

                <div className="attendance-summary-card">

                  <div className="attendance-summary-icon green">

                    <CheckCircle2
                      size={19}
                    />

                  </div>

                  <div>

                    <span>
                      Classes Attended
                    </span>

                    <strong>
                      {overall.attended}
                    </strong>

                  </div>

                </div>

                <div className="attendance-summary-card">

                  <div className="attendance-summary-icon red">

                    <XCircle
                      size={19}
                    />

                  </div>

                  <div>

                    <span>
                      Classes Missed
                    </span>

                    <strong>
                      {classesMissed}
                    </strong>

                  </div>

                </div>

                <div className="attendance-summary-card">

                  <div className="attendance-summary-icon blue">

                    <TrendingUp
                      size={19}
                    />

                  </div>

                  <div>

                    <span>
                      Subjects Safe
                    </span>

                    <strong>
                      {safeSubjects}
                    </strong>

                  </div>

                </div>

                <div className="attendance-summary-card">

                  <div className="attendance-summary-icon orange">

                    <AlertCircle
                      size={19}
                    />

                  </div>

                  <div>

                    <span>
                      Needs Attention
                    </span>

                    <strong>
                      {attentionSubjects}
                    </strong>

                  </div>

                </div>

              </section>

              {/* =================================
                  MAIN GRID
              ================================= */}

              <div className="attendance-main-grid">

                {/* SUBJECT LIST */}

                <section className="attendance-card">

                  <div className="attendance-card-header">

                    <div>

                      <h2>
                        Subject Attendance
                      </h2>

                      <p>
                        These are the subjects
                        from your CampusFlow
                        account.
                      </p>

                    </div>

                  </div>

                  <div className="attendance-subject-list">

                    {attendanceSubjects.map(
                      (subject) => {

                        const percentage =
                          subject.percentage;

                        const status =
                          getStatus(
                            percentage
                          );

                        const isSelected =
                          String(
                            subject._id
                          ) ===
                          String(
                            selectedSubject
                          );

                        return (
                          <button
                            type="button"
                            key={
                              subject._id
                            }
                            className={`attendance-subject ${
                              isSelected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleSelectSubject(
                                subject._id
                              )
                            }
                          >

                            <div className="attendance-subject-icon">

                              {subject.code
                                ? subject.code
                                    .charAt(0)
                                    .toUpperCase()
                                : subject.name
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>

                            <div className="attendance-subject-info">

                              <strong>
                                {subject.name}
                              </strong>

                              <span>
                                {subject.code ||
                                  "No code"}{" "}
                                ·{" "}
                                {subject.attended}/
                                {subject.total}
                              </span>

                              <div className="attendance-mini-progress">

                                <div
                                  className={
                                    subject.total
                                      ? status.className
                                      : ""
                                  }
                                  style={{
                                    width: `${
                                      subject.total
                                        ? percentage
                                        : 0
                                    }%`,
                                  }}
                                />

                              </div>

                            </div>

                            <div className="attendance-subject-score">

                              <strong
                                className={
                                  subject.total
                                    ? status.className
                                    : ""
                                }
                              >

                                {subject.total
                                  ? `${percentage}%`
                                  : "--"}

                              </strong>

                              <span
                                className={
                                  subject.total
                                    ? status.className
                                    : ""
                                }
                              >

                                {subject.total
                                  ? status.label
                                  : "Not marked"}

                              </span>

                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                </section>

                {/* CALCULATOR */}

                <section className="attendance-card">

                  <div className="attendance-card-header">

                    <div>

                      <h2>
                        Attendance Calculator
                      </h2>

                      <p>
                        Plan your upcoming
                        classes.
                      </p>

                    </div>

                  </div>

                  {selected && (
                    <>

                      <div className="attendance-calculator-subject">

                        <div className="attendance-calculator-icon">

                          <CalendarCheck
                            size={20}
                          />

                        </div>

                        <div>

                          <span>
                            Selected subject
                          </span>

                          <strong>
                            {selected.name}
                          </strong>

                          <small>
                            {selected.code ||
                              "No code"}
                          </small>

                        </div>

                      </div>

                      <div className="attendance-calculator-tabs">

                        <button
                          type="button"
                          className={
                            calculatorMode ===
                            "miss"
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setCalculatorMode(
                              "miss"
                            )
                          }
                        >

                          <ArrowDown
                            size={16}
                          />

                          Classes I can miss

                        </button>

                        <button
                          type="button"
                          className={
                            calculatorMode ===
                            "need"
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setCalculatorMode(
                              "need"
                            )
                          }
                        >

                          <ArrowUp
                            size={16}
                          />

                          Classes I need

                        </button>

                      </div>

                      <div className="attendance-calculator-result">

                        {calculatorMode ===
                        "miss" ? (
                          <>
                            <div className="attendance-result-icon safe">

                              <CheckCircle2
                                size={22}
                              />

                            </div>

                            <div>

                              <span>
                                You can currently
                                miss
                              </span>

                              <strong>
                                {missableClasses}{" "}
                                {missableClasses ===
                                1
                                  ? "class"
                                  : "classes"}
                              </strong>

                              <small>
                                and stay at or
                                above 75%
                                attendance.
                              </small>

                            </div>
                          </>
                        ) : (
                          <>
                            <div className="attendance-result-icon required">

                              <Target
                                size={22}
                              />

                            </div>

                            <div>

                              <span>
                                You need to attend
                              </span>

                              <strong>
                                {requiredClasses}{" "}
                                {requiredClasses ===
                                1
                                  ? "class"
                                  : "classes"}
                              </strong>

                              <small>
                                consecutively to
                                reach 75%.
                              </small>

                            </div>

                          </>
                        )}

                      </div>

                      <div className="attendance-calculator-stats">

                        <div>

                          <span>
                            Current
                          </span>

                          <strong>
                            {selectedPercentage}%
                          </strong>

                        </div>

                        <div>

                          <span>
                            Target
                          </span>

                          <strong>
                            75%
                          </strong>

                        </div>

                        <div>

                          <span>
                            Attended
                          </span>

                          <strong>
                            {selected.attended}/
                            {selected.total}
                          </strong>

                        </div>

                      </div>

                    </>
                  )}

                </section>

              </div>

              {/* =================================
                  MARK ATTENDANCE
              ================================= */}

              <section className="attendance-card attendance-mark-card">

                <div className="attendance-card-header">

                  <div>

                    <h2>
                      Mark Today's Attendance
                    </h2>

                    <p>
                      Quickly update attendance
                      for the selected subject.
                    </p>

                  </div>

                  <div className="attendance-today-badge">
                    Today
                  </div>

                </div>

                {selected && (

                  <div className="attendance-mark-content">

                    <div className="attendance-selected-subject">

                      <div className="attendance-selected-icon">

                        {selected.code
                          ? selected.code
                              .charAt(0)
                              .toUpperCase()
                          : selected.name
                              .charAt(0)
                              .toUpperCase()}

                      </div>

                      <div>

                        <strong>
                          {selected.name}
                        </strong>

                        <span>
                          Current attendance:{" "}
                          {selected.total
                            ? `${selectedPercentage}%`
                            : "Not marked"}
                        </span>

                      </div>

                    </div>

                    <div className="attendance-mark-actions">

                      <button
                        type="button"
                        className="attendance-action present"
                        disabled={saving}
                        onClick={() =>
                          markAttendance(
                            selected,
                            true
                          )
                        }
                      >

                        <CheckCircle2
                          size={18}
                        />

                        {saving
                          ? "Saving..."
                          : "Present"}

                      </button>

                      <button
                        type="button"
                        className="attendance-action absent"
                        disabled={saving}
                        onClick={() =>
                          markAttendance(
                            selected,
                            false
                          )
                        }
                      >

                        <XCircle
                          size={18}
                        />

                        {saving
                          ? "Saving..."
                          : "Absent"}

                      </button>

                    </div>

                  </div>

                )}

              </section>

              {/* =================================
                  TIPS
              ================================= */}

              <section className="attendance-tip">

                <div className="attendance-tip-icon">

                  <Target size={19} />

                </div>

                <div>

                  <strong>
                    Keep your attendance
                    above 75%
                  </strong>

                  <p>
                    Attend classes consistently.
                    If your attendance drops
                    below the required percentage,
                    use the calculator above to
                    plan how many classes you need
                    to attend.
                  </p>

                </div>

              </section>
            </>
          )}
        </>
      )}

    </div>
  );
}