import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Target,
  BookOpen,
  Flame,
  Trophy,
  Brain,
  ChevronUp,
  ChevronDown,
  Minus,
  Save,
  CheckCircle2,
} from "lucide-react";

import { subjectsAPI } from "../../services/api";

import "./SGPA.css";

/* =========================================================
   GRADE SYSTEM
========================================================= */

const GRADE_POINTS = [
  { min: 90, grade: "O", point: 10 },
  { min: 80, grade: "A+", point: 9 },
  { min: 70, grade: "A", point: 8 },
  { min: 60, grade: "B+", point: 7 },
  { min: 55, grade: "B", point: 6 },
  { min: 50, grade: "C", point: 5 },
  { min: 40, grade: "P", point: 4 },
  { min: 0, grade: "F", point: 0 },
];

/* =========================================================
   GRADE
========================================================= */

function getGrade(percentage) {
  return (
    GRADE_POINTS.find(
      (item) => percentage >= item.min
    ) || {
      grade: "F",
      point: 0,
    }
  );
}

/* =========================================================
   CURRENT SEMESTER
========================================================= */

function getCurrentSemester() {
  try {
    const possibleKeys = [
      "campusflow_user",
      "user",
      "campusflowUser",
    ];

    for (const key of possibleKeys) {
      const stored = localStorage.getItem(key);

      if (!stored) continue;

      const user = JSON.parse(stored);

      const semester =
        Number(
          user?.semester ??
            user?.user?.semester
        ) || 0;

      if (semester > 0) {
        return semester;
      }
    }

    return 1;
  } catch {
    return 1;
  }
}

/* =========================================================
   PERFORMANCE
========================================================= */

function getPerformance(
  average,
  trend,
  predicted
) {
  if (
    average >= 85 ||
    predicted >= 90
  ) {
    return {
      label: "Excellent",
      className: "excellent",
      icon: Flame,
    };
  }

  if (
    average >= 70 ||
    predicted >= 80
  ) {
    return {
      label: "Strong",
      className: "strong",
      icon: Trophy,
    };
  }

  if (trend > 2) {
    return {
      label: "Improving",
      className: "improving",
      icon: TrendingUp,
    };
  }

  if (
    average < 50 ||
    predicted < 50
  ) {
    return {
      label: "Needs Attention",
      className: "attention",
      icon: AlertCircle,
    };
  }

  return {
    label: "Stable",
    className: "stable",
    icon: Minus,
  };
}

/* =========================================================
   CREATE EMPTY MARKS
========================================================= */

function createEmptyMarks(subjects) {
  const result = {};

  subjects.forEach((subject) => {
    result[subject._id] = {
      ia1: "",
      ia2: "",
      ia3: "",
    };
  });

  return result;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SGPA() {
  const [subjects, setSubjects] =
    useState([]);

  const [marks, setMarks] =
    useState({});

  const [semester, setSemester] =
    useState(
      getCurrentSemester()
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  /* =======================================================
     STORAGE KEY
  ======================================================= */

  const storageKey =
    `campusflow_sgpa_marks_semester_${semester}`;

  /* =======================================================
     LOAD SUBJECTS
  ======================================================= */

  useEffect(() => {
    loadSubjects();
  }, []);

  /* =======================================================
     LOAD SAVED MARKS
  ======================================================= */

  useEffect(() => {
    if (!subjects.length) return;

    try {
      const savedData =
        localStorage.getItem(
          storageKey
        );

      if (savedData) {
        const parsed =
          JSON.parse(savedData);

        const initial =
          createEmptyMarks(
            subjects
          );

        const merged = {
          ...initial,
          ...parsed,
        };

        setMarks(merged);
        setSaved(true);
      } else {
        setMarks(
          createEmptyMarks(
            subjects
          )
        );

        setSaved(false);
      }
    } catch (err) {
      console.error(
        "Unable to restore SGPA data:",
        err
      );

      setMarks(
        createEmptyMarks(
          subjects
        )
      );
    }
  }, [
    subjects,
    storageKey,
  ]);

  /* =======================================================
     LOAD SUBJECTS
  ======================================================= */

  async function loadSubjects() {
    try {
      setLoading(true);
      setError("");

      const response =
        await subjectsAPI.getAll();

      console.log(
        "SGPA subjects:",
        response
      );

      const loadedSubjects =
        Array.isArray(
          response?.subjects
        )
          ? response.subjects
          : [];

      setSubjects(
        loadedSubjects
      );
    } catch (err) {
      console.error(
        "SGPA subject loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load subjects."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     UPDATE IA
  ======================================================= */

  function updateIA(
    subjectId,
    ia,
    value
  ) {
    if (value === "") {
      setMarks((current) => ({
        ...current,

        [subjectId]: {
          ...(current[
            subjectId
          ] || {
            ia1: "",
            ia2: "",
            ia3: "",
          }),

          [ia]: "",
        },
      }));

      setSaved(false);

      return;
    }

    let number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      return;
    }

    number = Math.max(
      0,
      Math.min(50, number)
    );

    setMarks((current) => ({
      ...current,

      [subjectId]: {
        ...(current[
          subjectId
        ] || {
          ia1: "",
          ia2: "",
          ia3: "",
        }),

        [ia]: number,
      },
    }));

    setSaved(false);
    setError("");
  }

  /* =======================================================
     CALCULATE SUBJECTS
  ======================================================= */

  const calculatedSubjects =
    useMemo(() => {
      return subjects.map(
        (subject) => {
          const current =
            marks[
              subject._id
            ] || {};

          const ia1 =
            current.ia1 ===
            undefined ||
            current.ia1 === ""
              ? null
              : Number(
                  current.ia1
                );

          const ia2 =
            current.ia2 ===
            undefined ||
            current.ia2 === ""
              ? null
              : Number(
                  current.ia2
                );

          const ia3 =
            current.ia3 ===
            undefined ||
            current.ia3 === ""
              ? null
              : Number(
                  current.ia3
                );

          const entered = [
            ia1,
            ia2,
            ia3,
          ].filter(
            (value) =>
              value !== null &&
              !Number.isNaN(
                value
              )
          );

          const average =
            entered.length > 0
              ? entered.reduce(
                  (sum, value) =>
                    sum + value,
                  0
                ) /
                entered.length
              : 0;

          const bestIA =
            entered.length > 0
              ? Math.max(
                  ...entered
                )
              : 0;

          const worstIA =
            entered.length > 0
              ? Math.min(
                  ...entered
                )
              : 0;

          const first =
            ia1 ?? average;

          const last =
            ia3 ??
            ia2 ??
            ia1 ??
            average;

          const trend =
            entered.length >= 2
              ? last - first
              : 0;

          const consistency =
            entered.length > 0
              ? Math.max(
                  0,
                  100 -
                    (bestIA -
                      worstIA) *
                      2
                )
              : 0;

          const iaPercentage =
            average > 0
              ? (average / 50) *
                100
              : 0;

          /* -----------------------------------------------
             PREDICT SEE
          ------------------------------------------------ */

          let predictedSEE =
            45 +
            iaPercentage * 0.5;

          if (trend >= 5) {
            predictedSEE += 3;
          } else if (
            trend >= 2
          ) {
            predictedSEE += 1.5;
          } else if (
            trend <= -5
          ) {
            predictedSEE -= 3;
          }

          predictedSEE =
            Math.max(
              30,
              Math.min(
                95,
                predictedSEE
              )
            );

          /* -----------------------------------------------
             FINAL PREDICTION
          ------------------------------------------------ */

          const predictedFinal =
            average > 0
              ? iaPercentage *
                  0.5 +
                predictedSEE *
                  0.5
              : 0;

          const gradeInfo =
            getGrade(
              predictedFinal
            );

          const credits =
            Number(
              subject.credits
            ) || 0;

          const weightedPoints =
            credits *
            gradeInfo.point;

          const performance =
            getPerformance(
              iaPercentage,
              trend,
              predictedFinal
            );

          return {
            ...subject,

            ia1,
            ia2,
            ia3,

            enteredCount:
              entered.length,

            average,
            bestIA,
            worstIA,
            trend,
            consistency,

            iaPercentage,

            predictedSEE,

            predictedFinal,

            grade:
              gradeInfo.grade,

            gradePoint:
              gradeInfo.point,

            credits,

            weightedPoints,

            performance,
          };
        }
      );
    }, [
      subjects,
      marks,
    ]);

  /* =======================================================
     ACTIVE SUBJECTS
  ======================================================= */

  const activeSubjects =
    calculatedSubjects.filter(
      (subject) =>
        subject.enteredCount >
        0
    );

  /* =======================================================
     TOTAL CREDITS
  ======================================================= */

  const totalCredits =
    calculatedSubjects.reduce(
      (sum, subject) =>
        sum + subject.credits,
      0
    );

  /* =======================================================
     WEIGHTED POINTS
  ======================================================= */

  const totalWeightedPoints =
    calculatedSubjects.reduce(
      (sum, subject) =>
        sum +
        subject.weightedPoints,
      0
    );

  /* =======================================================
     SGPA
  ======================================================= */

  const predictedSGPA =
    totalCredits > 0
      ? totalWeightedPoints /
        totalCredits
      : 0;

  /* =======================================================
     IA AVERAGE
  ======================================================= */

  const overallIA =
    activeSubjects.length >
    0
      ? activeSubjects.reduce(
          (sum, subject) =>
            sum +
            subject.average,
          0
        ) /
        activeSubjects.length
      : 0;

  /* =======================================================
     FINAL PREDICTION
  ======================================================= */

  const overallPrediction =
    activeSubjects.length >
    0
      ? activeSubjects.reduce(
          (sum, subject) =>
            sum +
            subject.predictedFinal,
          0
        ) /
        activeSubjects.length
      : 0;

  /* =======================================================
     STRONGEST
  ======================================================= */

  const strongestSubject =
    activeSubjects.length > 0
      ? [
          ...activeSubjects,
        ].sort(
          (a, b) =>
            b.predictedFinal -
            a.predictedFinal
        )[0]
      : null;

  /* =======================================================
     ATTENTION
  ======================================================= */

  const attentionSubject =
    activeSubjects.length > 0
      ? [
          ...activeSubjects,
        ].sort(
          (a, b) =>
            a.predictedFinal -
            b.predictedFinal
        )[0]
      : null;

  /* =======================================================
     CONFIDENCE
  ======================================================= */

  const averageInputs =
    subjects.length > 0
      ? activeSubjects.reduce(
          (sum, subject) =>
            sum +
            subject.enteredCount,
          0
        ) /
        subjects.length
      : 0;

  const confidence =
    Math.round(
      Math.min(
        98,
        averageInputs * 33
      )
    );

  /* =======================================================
     SAVE
  ======================================================= */

  function savePrediction() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          marks
        )
      );

      localStorage.setItem(
        `${storageKey}_updated`,
        new Date().toISOString()
      );

      setSaved(true);
      setError("");
    } catch (err) {
      console.error(
        "Save SGPA error:",
        err
      );

      setError(
        "Unable to save your prediction."
      );
    }
  }

  /* =======================================================
     RESET
  ======================================================= */

  function resetMarks() {
    const empty =
      createEmptyMarks(
        subjects
      );

    setMarks(empty);

    localStorage.removeItem(
      storageKey
    );

    localStorage.removeItem(
      `${storageKey}_updated`
    );

    setSaved(false);
  }

  /* =======================================================
     TARGET MESSAGE
  ======================================================= */

  function getTargetMessage(
    target
  ) {
    if (
      predictedSGPA >=
      target
    ) {
      return `You're already on track for ${target.toFixed(
        1
      )}+ SGPA 🎯`;
    }

    const difference =
      target -
      predictedSGPA;

    if (difference <= 0.5) {
      return "Very close! Focus on weaker subjects.";
    }

    if (difference <= 1) {
      return "Possible with a strong SEE performance.";
    }

    return "You'll need a significant improvement.";
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="sgpa-page">
        <div className="sgpa-loading">
          <RefreshCw
            size={24}
            className="sgpa-spin"
          />

          <span>
            Loading your subjects...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="sgpa-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="sgpa-header">

        <div>
          <div className="sgpa-eyebrow">
            <Brain size={16} />

            Smart Academic Predictor
          </div>

          <h1>
            SGPA Predictor
          </h1>

          <p>
            Enter IA-1, IA-2 and IA-3
            marks and predict your
            semester performance.
          </p>
        </div>

        <div className="sgpa-semester">

          <label>
            Semester
          </label>

          <select
            value={semester}
            onChange={(e) =>
              setSemester(
                Number(
                  e.target.value
                )
              )
            }
          >
            {Array.from(
              {
                length: 8,
              },
              (_, i) => (
                <option
                  key={i + 1}
                  value={i + 1}
                >
                  Semester {i + 1}
                </option>
              )
            )}
          </select>

        </div>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="sgpa-alert">

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
            ×
          </button>

        </div>
      )}

      {/* =================================================
          RESULT CARDS
      ================================================= */}

      <section className="sgpa-results">

        <div className="sgpa-result-card primary">

          <div className="sgpa-result-icon">

            <TrendingUp
              size={22}
            />

          </div>

          <div>

            <span>
              Predicted SGPA
            </span>

            <strong>
              {predictedSGPA.toFixed(
                2
              )}
            </strong>

            <small>
              / 10.00
            </small>

          </div>

        </div>

        <div className="sgpa-result-card">

          <div className="sgpa-result-icon green">

            <Target
              size={22}
            />

          </div>

          <div>

            <span>
              IA Average
            </span>

            <strong>
              {overallIA.toFixed(
                1
              )}
            </strong>

            <small>
              / 50
            </small>

          </div>

        </div>

        <div className="sgpa-result-card">

          <div className="sgpa-result-icon orange">

            <GraduationCap
              size={22}
            />

          </div>

          <div>

            <span>
              Predicted Final
            </span>

            <strong>
              {overallPrediction.toFixed(
                1
              )}
              %
            </strong>

            <small>
              estimated
            </small>

          </div>

        </div>

      </section>

      {/* =================================================
          INSIGHTS
      ================================================= */}

      {activeSubjects.length >
        0 && (
        <section className="sgpa-insights">

          <div className="sgpa-insight">

            <Trophy size={19} />

            <div>

              <span>
                Strongest Subject
              </span>

              <strong>
                {strongestSubject?.name ||
                  "--"}
              </strong>

            </div>

          </div>

          <div className="sgpa-insight">

            <AlertCircle
              size={19}
            />

            <div>

              <span>
                Needs Attention
              </span>

              <strong>
                {attentionSubject?.name ||
                  "--"}
              </strong>

            </div>

          </div>

          <div className="sgpa-insight">

            <Brain size={19} />

            <div>

              <span>
                Prediction Confidence
              </span>

              <strong>
                {confidence}%
              </strong>

            </div>

          </div>

        </section>
      )}

      {/* =================================================
          CRITERIA
      ================================================= */}

      <section className="sgpa-criteria">

        <div className="sgpa-criteria-title">

          <Target size={18} />

          <div>

            <h2>
              How the prediction works
            </h2>

            <p>
              CampusFlow analyzes all three
              IAs, your trend and estimated
              SEE performance.
            </p>

          </div>

        </div>

        <div className="sgpa-criteria-grid">

          <div>
            <strong>1</strong>

            <span>
              IA Average
            </span>

            <small>
              Average of IA-1, IA-2
              and IA-3.
            </small>
          </div>

          <div>
            <strong>2</strong>

            <span>
              Performance Trend
            </span>

            <small>
              Checks whether your
              marks are improving.
            </small>
          </div>

          <div>
            <strong>3</strong>

            <span>
              SEE Prediction
            </span>

            <small>
              Estimates expected
              SEE performance.
            </small>
          </div>

          <div>
            <strong>4</strong>

            <span>
              SGPA
            </span>

            <small>
              Uses credit-weighted
              grade points.
            </small>
          </div>

        </div>

        <div className="sgpa-formula">

          <span>
            Prediction Formula
          </span>

          <strong>
            IA Performance 50% +
            Predicted SEE 50%
          </strong>

        </div>

      </section>

      {/* =================================================
          SUBJECTS
      ================================================= */}

      <section className="sgpa-section">

        <div className="sgpa-section-header">

          <div>

            <h2>
              IA Performance
            </h2>

            <p>
              Enter marks out of 50 for
              each internal assessment.
            </p>

          </div>

          <span>
            {subjects.length} Subjects
          </span>

        </div>

        {subjects.length ===
        0 ? (
          <div className="sgpa-empty">

            <BookOpen
              size={32}
            />

            <h3>
              No subjects found
            </h3>

            <p>
              Add subjects from the
              Subjects page first.
            </p>

          </div>
        ) : (
          <div className="sgpa-subject-list">

            {calculatedSubjects.map(
              (subject) => {

                const PerformanceIcon =
                  subject.performance
                    .icon;

                return (
                  <article
                    className="sgpa-subject-card"
                    key={
                      subject._id
                    }
                  >

                    {/* SUBJECT */}

                    <div className="sgpa-subject-info">

                      <div
                        className="sgpa-subject-icon"
                        style={{
                          background:
                            `${
                              subject.color ||
                              "#2563eb"
                            }18`,
                          color:
                            subject.color ||
                            "#2563eb",
                        }}
                      >
                        <BookOpen
                          size={20}
                        />
                      </div>

                      <div>

                        <span>
                          {subject.code ||
                            "SUBJECT"}
                        </span>

                        <h3>
                          {subject.name}
                        </h3>

                        <small>
                          {subject.credits}{" "}
                          {subject.credits ===
                          1
                            ? "Credit"
                            : "Credits"}
                        </small>

                      </div>

                    </div>

                    {/* IA INPUTS */}

                    <div className="sgpa-ia-grid">

                      {[
                        [
                          "ia1",
                          "IA-1",
                        ],
                        [
                          "ia2",
                          "IA-2",
                        ],
                        [
                          "ia3",
                          "IA-3",
                        ],
                      ].map(
                        ([key, label]) => (
                          <div
                            key={key}
                          >

                            <label>
                              {label}
                            </label>

                            <div className="sgpa-input">

                              <input
                                type="number"
                                min="0"
                                max="50"
                                step="1"
                                placeholder="--"
                                value={
                                  subject[
                                    key
                                  ] ??
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateIA(
                                    subject._id,
                                    key,
                                    e.target
                                      .value
                                  )
                                }
                              />

                              <span>
                                /50
                              </span>

                            </div>

                          </div>
                        )
                      )}

                    </div>

                    {/* ANALYSIS */}

                    <div className="sgpa-analysis">

                      <div className="sgpa-analysis-top">

                        <span
                          className={`sgpa-badge ${subject.performance.className}`}
                        >

                          <PerformanceIcon
                            size={12}
                          />

                          {
                            subject
                              .performance
                              .label
                          }

                        </span>

                        <span className="sgpa-count">

                          {
                            subject.enteredCount
                          }
                          /3 IAs

                        </span>

                      </div>

                      <div className="sgpa-analysis-grid">

                        <div>

                          <span>
                            Average
                          </span>

                          <strong>
                            {subject.enteredCount
                              ? subject.average.toFixed(
                                  1
                                )
                              : "--"}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Trend
                          </span>

                          <strong
                            className={
                              subject.trend >
                              0
                                ? "trend-up"
                                : subject.trend <
                                  0
                                ? "trend-down"
                                : ""
                            }
                          >

                            {subject.enteredCount >=
                            2 ? (
                              subject.trend >
                              0 ? (
                                <>
                                  <ChevronUp
                                    size={13}
                                  />

                                  +
                                  {subject.trend.toFixed(
                                    1
                                  )}
                                </>
                              ) : subject.trend <
                                0 ? (
                                <>
                                  <ChevronDown
                                    size={13}
                                  />

                                  {subject.trend.toFixed(
                                    1
                                  )}
                                </>
                              ) : (
                                "Stable"
                              )
                            ) : (
                              "--"
                            )}

                          </strong>

                        </div>

                        <div>

                          <span>
                            Est. SEE
                          </span>

                          <strong>
                            {subject.enteredCount
                              ? `${subject.predictedSEE.toFixed(
                                  0
                                )}%`
                              : "--"}
                          </strong>

                        </div>

                      </div>

                    </div>

                    {/* FINAL */}

                    <div className="sgpa-final">

                      <span>
                        Predicted Grade
                      </span>

                      <strong
                        className={`grade-${subject.grade.replace(
                          "+",
                          "plus"
                        )}`}
                      >
                        {subject.enteredCount
                          ? subject.grade
                          : "--"}
                      </strong>

                      <small>
                        {subject.enteredCount
                          ? `${subject.predictedFinal.toFixed(
                              1
                            )}% · ${
                              subject.gradePoint
                            } GP`
                          : "Enter IA marks"}
                      </small>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* =================================================
          TARGETS
      ================================================= */}

      {activeSubjects.length >
        0 && (
        <section className="sgpa-targets">

          <div className="sgpa-target-header">

            <Target size={20} />

            <div>

              <h2>
                SGPA Targets
              </h2>

              <p>
                See how your current
                prediction compares.
              </p>

            </div>

          </div>

          <div className="sgpa-target-grid">

            {[8, 8.5, 9, 9.5].map(
              (target) => {

                const achieved =
                  predictedSGPA >=
                  target;

                return (
                  <div
                    key={target}
                    className={
                      achieved
                        ? "sgpa-target achieved"
                        : "sgpa-target"
                    }
                  >

                    <div>

                      <strong>
                        {target.toFixed(
                          1
                        )}
                      </strong>

                      <span>
                        SGPA
                      </span>

                    </div>

                    <p>
                      {getTargetMessage(
                        target
                      )}
                    </p>

                  </div>
                );
              }
            )}

          </div>

        </section>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      {subjects.length >
        0 && (
        <div className="sgpa-actions">

          <button
            type="button"
            className="sgpa-reset-button"
            onClick={
              resetMarks
            }
          >

            <RefreshCw
              size={16}
            />

            Reset

          </button>

          <button
            type="button"
            className="sgpa-save-button"
            onClick={
              savePrediction
            }
          >

            {saved ? (
              <>
                <CheckCircle2
                  size={16}
                />

                Saved
              </>
            ) : (
              <>
                <Save
                  size={16}
                />

                Save Prediction
              </>
            )}

          </button>

        </div>
      )}

      {/* =================================================
          SAVE INFO
      ================================================= */}

      {saved && (
        <div className="sgpa-saved-message">

          <CheckCircle2
            size={16}
          />

          <span>
            Your IA marks and prediction
            have been saved on this device.
          </span>

        </div>
      )}

      {/* =================================================
          DISCLAIMER
      ================================================= */}

      <div className="sgpa-disclaimer">

        <AlertCircle
          size={15}
        />

        <span>
          This SGPA is an estimated prediction
          based on IA performance, trend and
          predicted SEE performance. It is not
          an official university calculation.
        </span>

      </div>

    </div>
  );
}