// src/pages/Sgpa.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Calculator,
  AlertCircle,
  Info,
  Target,
  Save,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Clock,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

import {
  generateAcademicRecommendations,
  getHighPrioritySubjects,
} from "../utils/academicRecommendations";


// ======================================================
// VTU GRADE SCALE
// ======================================================

const GRADE_SCALE = [
  {
    min: 90,
    grade: "O",
    point: 10,
  },
  {
    min: 80,
    grade: "A+",
    point: 9,
  },
  {
    min: 70,
    grade: "A",
    point: 8,
  },
  {
    min: 60,
    grade: "B+",
    point: 7,
  },
  {
    min: 55,
    grade: "B",
    point: 6,
  },
  {
    min: 50,
    grade: "C",
    point: 5,
  },
  {
    min: 40,
    grade: "P",
    point: 4,
  },
  {
    min: 0,
    grade: "F",
    point: 0,
  },
];


// ======================================================
// GRADE CALCULATION
// ======================================================

const getGradeFromMarks = (marks) => {
  if (
    marks === null ||
    marks === undefined ||
    marks === "" ||
    Number.isNaN(Number(marks))
  ) {
    return {
      grade: "-",
      point: 0,
    };
  }

  for (const item of GRADE_SCALE) {
    if (Number(marks) >= item.min) {
      return {
        grade: item.grade,
        point: item.point,
      };
    }
  }

  return {
    grade: "F",
    point: 0,
  };
};


// ======================================================
// CIE CALCULATION
// ======================================================

const calculateCIE = (ia1, ia2) => {
  if (
    ia1 === "" ||
    ia1 === null ||
    ia1 === undefined
  ) {
    return null;
  }

  const first = Number(ia1);

  if (Number.isNaN(first)) {
    return null;
  }

  // Only IA-1 entered
  if (
    ia2 === "" ||
    ia2 === null ||
    ia2 === undefined
  ) {
    return first;
  }

  const second = Number(ia2);

  if (Number.isNaN(second)) {
    return first;
  }

  // Temporary CIE indicator
  return (first + second) / 2;
};


// ======================================================
// RISK
// ======================================================

const getRisk = (percentage) => {
  if (percentage >= 80) {
    return {
      level: "LOW",
      label: "Excellent",
      color: "#16a34a",
      background: "#f0fdf4",
    };
  }

  if (percentage >= 60) {
    return {
      level: "MEDIUM",
      label: "Needs Attention",
      color: "#d97706",
      background: "#fffbeb",
    };
  }

  return {
    level: "HIGH",
    label: "Needs Improvement",
    color: "#dc2626",
    background: "#fef2f2",
  };
};


// ======================================================
// MAIN COMPONENT
// ======================================================

export default function SGPA() {
  const { currentUser } = useAuth();

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [savingId, setSavingId] =
    useState(null);

  const [savedId, setSavedId] =
    useState(null);

  const [iaMarks, setIaMarks] =
    useState({});


  // ====================================================
  // LOAD SUBJECTS FROM FIREBASE
  // ====================================================

  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "subjects"),
      where(
        "userId",
        "==",
        currentUser.uid
      )
    );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {
          const fetchedSubjects =
            snapshot.docs.map(
              (docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
              })
            );

          setSubjects(
            fetchedSubjects
          );


          // Load saved IA marks
          const savedMarks = {};

          fetchedSubjects.forEach(
            (subject) => {
              savedMarks[
                subject.id
              ] = {
                ia1:
                  subject.ia1 !==
                  undefined
                    ? subject.ia1
                    : "",

                ia2:
                  subject.ia2 !==
                  undefined
                    ? subject.ia2
                    : "",
              };
            }
          );

          setIaMarks(
            savedMarks
          );

          setLoading(false);
        },
        (err) => {
          console.error(
            "Firebase subjects error:",
            err
          );

          setError(
            "Unable to load subjects from Firebase."
          );

          setLoading(false);
        }
      );

    return () =>
      unsubscribe();
  }, [currentUser]);


  // ====================================================
  // IA INPUT
  // ====================================================

  const handleIAMarkChange = (
    subjectId,
    field,
    value
  ) => {
    if (value === "") {
      setIaMarks(
        (previous) => ({
          ...previous,

          [subjectId]: {
            ...(previous[
              subjectId
            ] || {}),

            [field]: "",
          },
        })
      );

      return;
    }

    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      return;
    }

    if (
      number < 0 ||
      number > 50
    ) {
      return;
    }

    setIaMarks(
      (previous) => ({
        ...previous,

        [subjectId]: {
          ...(previous[
            subjectId
          ] || {}),

          [field]: number,
        },
      })
    );
  };


  // ====================================================
  // SAVE TO FIREBASE
  // ====================================================

  const saveIAMarks = async (
    subjectId
  ) => {
    if (!currentUser) {
      setError(
        "Please login first."
      );

      return;
    }

    const marks =
      iaMarks[subjectId] || {};

    const ia1 =
      marks.ia1 === "" ||
      marks.ia1 === undefined
        ? null
        : Number(marks.ia1);

    const ia2 =
      marks.ia2 === "" ||
      marks.ia2 === undefined
        ? null
        : Number(marks.ia2);


    // Validation

    if (
      ia1 !== null &&
      (ia1 < 0 ||
        ia1 > 50)
    ) {
      setError(
        "IA-1 must be between 0 and 50."
      );

      return;
    }

    if (
      ia2 !== null &&
      (ia2 < 0 ||
        ia2 > 50)
    ) {
      setError(
        "IA-2 must be between 0 and 50."
      );

      return;
    }


    try {
      setSavingId(
        subjectId
      );

      setError("");

      await updateDoc(
        doc(
          db,
          "subjects",
          subjectId
        ),
        {
          ia1,
          ia2,

          iaUpdatedAt:
            serverTimestamp(),
        }
      );

      setSavedId(
        subjectId
      );

      setTimeout(() => {
        setSavedId(null);
      }, 2000);
    } catch (err) {
      console.error(
        "Error saving IA:",
        err
      );

      setError(
        "Failed to save IA marks. Check Firebase rules."
      );
    } finally {
      setSavingId(null);
    }
  };


  // ====================================================
  // SGPA PREDICTION
  // ====================================================

  const prediction =
    useMemo(() => {
      const calculateScenario =
        (seePercentage) => {
          let totalCredits = 0;

          let totalQualityPoints = 0;

          const results = [];

          subjects.forEach(
            (subject) => {
              const credits =
                Number(
                  subject.credits
                ) || 0;

              if (
                credits <= 0
              ) {
                return;
              }

              const marks =
                iaMarks[
                  subject.id
                ] || {};

              const ia1 =
                marks.ia1;

              const ia2 =
                marks.ia2;


              // IA-1 required
              if (
                ia1 === "" ||
                ia1 === null ||
                ia1 ===
                  undefined
              ) {
                return;
              }


              const cie =
                calculateCIE(
                  ia1,
                  ia2
                );

              if (
                cie === null
              ) {
                return;
              }


              /*
                SEE is out of 100.

                For prediction we assume:
                40%, 70%, 90%

                converted to 50 marks.
              */

              const seeMarks =
                (seePercentage /
                  100) *
                50;


              const estimatedFinalMarks =
                cie +
                seeMarks;


              const grade =
                getGradeFromMarks(
                  estimatedFinalMarks
                );


              totalCredits +=
                credits;

              totalQualityPoints +=
                credits *
                grade.point;


              const iaPercentage =
                (Number(ia1) /
                  50) *
                100;


              const risk =
                getRisk(
                  iaPercentage
                );


              results.push({
                id: subject.id,

                name:
                  subject.name ||
                  subject.subjectName ||
                  "Subject",

                credits,

                ia1,

                ia2,

                cie,

                estimatedFinalMarks,

                grade:
                  grade.grade,

                gradePoint:
                  grade.point,

                risk,
              });
            }
          );


          const sgpa =
            totalCredits > 0
              ? totalQualityPoints /
                totalCredits
              : 0;


          return {
            sgpa:
              sgpa.toFixed(2),

            totalCredits,

            results,
          };
        };


      return {
        conservative:
          calculateScenario(40),

        expected:
          calculateScenario(70),

        best:
          calculateScenario(90),
      };
    }, [
      subjects,
      iaMarks,
    ]);


  // ====================================================
  // ACADEMIC RECOMMENDATIONS
  // ====================================================

  const academicRecommendations =
    useMemo(() => {
      const updatedSubjects =
        subjects.map(
          (subject) => ({
            ...subject,

            ia1:
              iaMarks[
                subject.id
              ]?.ia1 ?? "",

            ia2:
              iaMarks[
                subject.id
              ]?.ia2 ?? "",
          })
        );

      return generateAcademicRecommendations(
        updatedSubjects
      );
    }, [
      subjects,
      iaMarks,
    ]);


  // ====================================================
  // HIGH PRIORITY SUBJECTS
  // ====================================================

  const highPrioritySubjects =
    useMemo(() => {
      return getHighPrioritySubjects(
        academicRecommendations
      );
    }, [
      academicRecommendations,
    ]);


  // ====================================================
  // OVERALL ANALYSIS
  // ====================================================

  const analysis =
    useMemo(() => {
      const entered =
        subjects.filter(
          (subject) => {
            const mark =
              iaMarks[
                subject.id
              ]?.ia1;

            return (
              mark !==
                undefined &&
              mark !== "" &&
              mark !== null
            );
          }
        );


      if (
        entered.length ===
        0
      ) {
        return {
          average: null,
          risk: null,
          entered: 0,
          total:
            subjects.length,
        };
      }


      const total =
        entered.reduce(
          (sum, subject) => {
            return (
              sum +
              Number(
                iaMarks[
                  subject.id
                ].ia1
              )
            );
          },
          0
        );


      const average =
        total /
        entered.length;


      return {
        average,

        risk: getRisk(
          (average / 50) *
            100
        ),

        entered:
          entered.length,

        total:
          subjects.length,
      };
    }, [
      subjects,
      iaMarks,
    ]);


  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#f8fafc",

          color:
            "#475569",

          fontSize:
            "1rem",
        }}
      >
        Loading your academic data...
      </div>
    );
  }


  // ====================================================
  // UI
  // ====================================================

  return (
    <div
      style={{
        minHeight:
          "100%",

        padding:
          "2rem",

        background:
          "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth:
            "1400px",

          margin:
            "0 auto",
        }}
      >

        {/* ==============================================
            HEADER
        ============================================== */}

        <div
          style={{
            marginBottom:
              "1.5rem",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "12px",
            }}
          >
            <div
              style={{
                width: "46px",

                height: "46px",

                borderRadius:
                  "12px",

                background:
                  "#dbeafe",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",
              }}
            >
              <Calculator
                size={25}
                color="#2563eb"
              />
            </div>

            <div>
              <h1
                style={{
                  margin: 0,

                  fontSize:
                    "1.8rem",

                  fontWeight:
                    800,

                  color:
                    "#0f172a",
                }}
              >
                IA & SGPA
                Prediction
              </h1>

              <p
                style={{
                  margin:
                    "4px 0 0",

                  color:
                    "#64748b",

                  fontSize:
                    "0.9rem",
                }}
              >
                Track your IA performance
                and predict your semester
                SGPA.
              </p>
            </div>
          </div>
        </div>


        {/* ==============================================
            ERROR
        ============================================== */}

        {error && (
          <div
            style={{
              padding:
                "12px 15px",

              marginBottom:
                "1.2rem",

              borderRadius:
                "12px",

              background:
                "#fef2f2",

              border:
                "1px solid #fecaca",

              color:
                "#991b1b",

              display:
                "flex",

              gap: "10px",

              alignItems:
                "center",
            }}
          >
            <AlertCircle
              size={19}
            />

            {error}
          </div>
        )}


        {/* ==============================================
            TOP STATS
        ============================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",

            gap: "1rem",

            marginBottom:
              "1.5rem",
          }}
        >

          {/* IA AVERAGE */}

          <StatCard
            title="IA-1 Average"
            value={
              analysis.average !==
              null
                ? `${analysis.average.toFixed(
                    1
                  )}/50`
                : "—"
            }
            subtitle={
              analysis.average !==
              null
                ? `${analysis.entered} of ${analysis.total} subjects entered`
                : "Enter IA-1 marks"
            }
            icon={
              <BookOpen
                size={21}
              />
            }
            background="#ffffff"
            color="#2563eb"
          />


          {/* STATUS */}

          <StatCard
            title="Academic Status"
            value={
              analysis.risk
                ? analysis.risk.level
                : "—"
            }
            subtitle={
              analysis.risk
                ? analysis.risk.label
                : "Waiting for marks"
            }
            icon={
              <TrendingUp
                size={21}
              />
            }
            background={
              analysis.risk
                ? analysis.risk.background
                : "#ffffff"
            }
            color={
              analysis.risk
                ? analysis.risk.color
                : "#64748b"
            }
          />


          {/* EXPECTED SGPA */}

          <StatCard
            title="Expected SGPA"
            value={
              analysis.average !==
              null
                ? prediction.expected
                    .sgpa
                : "—"
            }
            subtitle="Assuming 70% SEE performance"
            icon={
              <Target
                size={21}
              />
            }
            background="#eff6ff"
            color="#2563eb"
          />


          {/* HIGH RISK */}

          <StatCard
            title="Subjects Needing Attention"
            value={
              highPrioritySubjects.length
            }
            subtitle={
              highPrioritySubjects.length >
              0
                ? "Focus on these first"
                : "No high-risk subjects"
            }
            icon={
              <AlertCircle
                size={21}
              />
            }
            background={
              highPrioritySubjects.length >
              0
                ? "#fef2f2"
                : "#f0fdf4"
            }
            color={
              highPrioritySubjects.length >
              0
                ? "#dc2626"
                : "#16a34a"
            }
          />
        </div>


        {/* ==============================================
            PREDICTION
        ============================================== */}

        {analysis.average !==
          null && (
          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap: "1rem",

              marginBottom:
                "1.5rem",
            }}
          >
            <PredictionCard
              title="Conservative"
              sgpa={
                prediction
                  .conservative
                  .sgpa
              }
              description="SEE performance around 40%"
              color="#dc2626"
              background="#fef2f2"
            />

            <PredictionCard
              title="Expected"
              sgpa={
                prediction
                  .expected
                  .sgpa
              }
              description="SEE performance around 70%"
              color="#2563eb"
              background="#eff6ff"
            />

            <PredictionCard
              title="Best Case"
              sgpa={
                prediction
                  .best
                  .sgpa
              }
              description="SEE performance around 90%"
              color="#16a34a"
              background="#f0fdf4"
            />
          </div>
        )}


        {/* ==============================================
            CAMPUSFLOW SUGGESTIONS
        ============================================== */}

        {academicRecommendations.length >
          0 && (
          <div
            style={{
              background:
                "#ffffff",

              border:
                "1px solid #e2e8f0",

              borderRadius:
                "16px",

              padding:
                "1.4rem",

              marginBottom:
                "1.5rem",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap: "10px",

                marginBottom:
                  "1rem",
              }}
            >
              <div
                style={{
                  width:
                    "38px",

                  height:
                    "38px",

                  borderRadius:
                    "10px",

                  background:
                    "#fef3c7",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",
                }}
              >
                <Lightbulb
                  size={20}
                  color="#d97706"
                />
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,

                    fontSize:
                      "1.1rem",

                    color:
                      "#0f172a",
                  }}
                >
                  CampusFlow
                  Suggestions
                </h2>

                <p
                  style={{
                    margin:
                      "3px 0 0",

                    color:
                      "#64748b",

                    fontSize:
                      "0.82rem",
                  }}
                >
                  Personalized from
                  your IA performance.
                </p>
              </div>
            </div>


            <div
              style={{
                display:
                  "grid",

                gap: "12px",
              }}
            >
              {academicRecommendations.map(
                (item) => (
                  <RecommendationCard
                    key={
                      item.subjectId
                    }
                    item={item}
                  />
                )
              )}
            </div>
          </div>
        )}


        {/* ==============================================
            INFO
        ============================================== */}

        <div
          style={{
            padding:
              "1rem",

            background:
              "#fffbeb",

            border:
              "1px solid #fde68a",

            borderRadius:
              "12px",

            marginBottom:
              "1.5rem",

            display:
              "flex",

            gap: "10px",

            color:
              "#92400e",

            fontSize:
              "0.85rem",
          }}
        >
          <Info
            size={19}
          />

          <div>
            <strong>
              Prediction only:
            </strong>{" "}
            The SGPA shown here is an
            estimate based on your IA
            marks and an assumed SEE
            performance. It is not your
            official VTU SGPA.
          </div>
        </div>


        {/* ==============================================
            SUBJECT TABLE
        ============================================== */}

        <div
          style={{
            background:
              "#ffffff",

            border:
              "1px solid #e2e8f0",

            borderRadius:
              "16px",

            overflow:
              "hidden",
          }}
        >

          <div
            style={{
              padding:
                "1.4rem",

              borderBottom:
                "1px solid #e2e8f0",
            }}
          >
            <h2
              style={{
                margin: 0,

                fontSize:
                  "1.1rem",

                color:
                  "#0f172a",
              }}
            >
              Internal Assessment
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",

                color:
                  "#64748b",

                fontSize:
                  "0.84rem",
              }}
            >
              Enter IA-1 now. Add IA-2
              later to improve the
              prediction.
            </p>
          </div>


          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table
              style={{
                width:
                  "100%",

                minWidth:
                  "1050px",

                borderCollapse:
                  "collapse",
              }}
            >

              <thead>
                <tr
                  style={{
                    background:
                      "#f8fafc",
                  }}
                >
                  <th style={headerStyle}>
                    Subject
                  </th>

                  <th style={headerStyle}>
                    Credits
                  </th>

                  <th style={headerStyle}>
                    IA-1 / 50
                  </th>

                  <th style={headerStyle}>
                    IA-2 / 50
                  </th>

                  <th style={headerStyle}>
                    CIE
                  </th>

                  <th style={headerStyle}>
                    Expected Grade
                  </th>

                  <th style={headerStyle}>
                    Risk
                  </th>

                  <th style={headerStyle}>
                    Save
                  </th>
                </tr>
              </thead>


              <tbody>
                {subjects.map(
                  (subject) => {
                    const marks =
                      iaMarks[
                        subject.id
                      ] || {};


                    const cie =
                      calculateCIE(
                        marks.ia1,
                        marks.ia2
                      );


                    const expected =
                      prediction.expected.results.find(
                        (item) =>
                          item.id ===
                          subject.id
                      );


                    const risk =
                      marks.ia1 !==
                        "" &&
                      marks.ia1 !==
                        undefined &&
                      marks.ia1 !==
                        null
                        ? getRisk(
                            (Number(
                              marks.ia1
                            ) /
                              50) *
                              100
                          )
                        : null;


                    return (
                      <tr
                        key={
                          subject.id
                        }
                        style={{
                          borderTop:
                            "1px solid #f1f5f9",
                        }}
                      >

                        {/* SUBJECT */}

                        <td
                          style={
                            cellStyle
                          }
                        >
                          <strong>
                            {subject.name ||
                              subject.subjectName ||
                              "Subject"}
                          </strong>
                        </td>


                        {/* CREDITS */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",
                          }}
                        >
                          {subject.credits ??
                            0}
                        </td>


                        {/* IA1 */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={
                              marks.ia1 ??
                              ""
                            }
                            placeholder="0-50"
                            onChange={(
                              e
                            ) =>
                              handleIAMarkChange(
                                subject.id,
                                "ia1",
                                e.target.value
                              )
                            }
                            style={
                              inputStyle
                            }
                          />
                        </td>


                        {/* IA2 */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={
                              marks.ia2 ??
                              ""
                            }
                            placeholder="Later"
                            onChange={(
                              e
                            ) =>
                              handleIAMarkChange(
                                subject.id,
                                "ia2",
                                e.target.value
                              )
                            }
                            style={
                              inputStyle
                            }
                          />
                        </td>


                        {/* CIE */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",

                            fontWeight:
                              800,

                            color:
                              "#2563eb",
                          }}
                        >
                          {cie !==
                          null
                            ? `${cie.toFixed(
                                1
                              )}/50`
                            : "—"}
                        </td>


                        {/* GRADE */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",
                          }}
                        >
                          {expected ? (
                            <span
                              style={{
                                padding:
                                  "5px 10px",

                                borderRadius:
                                  "999px",

                                background:
                                  "#eff6ff",

                                color:
                                  "#1d4ed8",

                                fontWeight:
                                  800,

                                fontSize:
                                  "0.78rem",
                              }}
                            >
                              {
                                expected.grade
                              }
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>


                        {/* RISK */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",
                          }}
                        >
                          {risk ? (
                            <span
                              style={{
                                padding:
                                  "5px 9px",

                                borderRadius:
                                  "999px",

                                background:
                                  risk.background,

                                color:
                                  risk.color,

                                fontWeight:
                                  800,

                                fontSize:
                                  "0.72rem",
                              }}
                            >
                              {
                                risk.level
                              }
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>


                        {/* SAVE */}

                        <td
                          style={{
                            ...cellStyle,

                            textAlign:
                              "center",
                          }}
                        >
                          <button
                            onClick={() =>
                              saveIAMarks(
                                subject.id
                              )
                            }
                            disabled={
                              savingId ===
                              subject.id
                            }
                            style={{
                              border:
                                "none",

                              background:
                                savedId ===
                                subject.id
                                  ? "#16a34a"
                                  : "#2563eb",

                              color:
                                "#ffffff",

                              padding:
                                "8px 12px",

                              borderRadius:
                                "8px",

                              cursor:
                                "pointer",

                              display:
                                "inline-flex",

                              alignItems:
                                "center",

                              gap: "6px",

                              fontWeight:
                                700,
                            }}
                          >
                            {savingId ===
                            subject.id ? (
                              "Saving..."
                            ) : savedId ===
                              subject.id ? (
                              <>
                                <CheckCircle2
                                  size={
                                    15
                                  }
                                />

                                Saved
                              </>
                            ) : (
                              <>
                                <Save
                                  size={
                                    15
                                  }
                                />

                                Save
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* ==============================================
            HOW IT WORKS
        ============================================== */}

        <div
          style={{
            marginTop:
              "1.5rem",

            background:
              "#ffffff",

            border:
              "1px solid #e2e8f0",

            borderRadius:
              "16px",

            padding:
              "1.4rem",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "10px",

              marginBottom:
                "10px",
            }}
          >
            <Target
              size={20}
              color="#2563eb"
            />

            <strong
              style={{
                color:
                  "#0f172a",
              }}
            >
              How CampusFlow works
            </strong>
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",

              gap: "10px",
            }}
          >

            <ProcessStep
              number="1"
              title="Enter IA-1"
              text="Track your current performance."
            />

            <ProcessStep
              number="2"
              title="Get Analysis"
              text="CampusFlow identifies weak subjects."
            />

            <ProcessStep
              number="3"
              title="Get Target"
              text="You receive an IA-2 target."
            />

            <ProcessStep
              number="4"
              title="Improve"
              text="Use the Study Planner to prepare."
            />
          </div>
        </div>

      </div>
    </div>
  );
}


// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  background,
  color,
}) {
  return (
    <div
      style={{
        background,

        border:
          "1px solid #e2e8f0",

        borderRadius:
          "16px",

        padding:
          "1.25rem",
      }}
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",
        }}
      >
        <span
          style={{
            color:
              "#64748b",

            fontSize:
              "0.76rem",

            fontWeight:
              800,
          }}
        >
          {title}
        </span>

        <span
          style={{
            color,

            display:
              "flex",
          }}
        >
          {icon}
        </span>
      </div>

      <div
        style={{
          fontSize:
            "1.9rem",

          fontWeight:
            900,

          color,

          marginTop:
            "8px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color:
            "#64748b",

          fontSize:
            "0.78rem",

          marginTop:
            "3px",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}


// ======================================================
// PREDICTION CARD
// ======================================================

function PredictionCard({
  title,
  sgpa,
  description,
  color,
  background,
}) {
  return (
    <div
      style={{
        background,

        border:
          `1px solid ${color}33`,

        borderRadius:
          "16px",

        padding:
          "1.4rem",

        borderTop:
          `5px solid ${color}`,
      }}
    >
      <div
        style={{
          color,

          fontWeight:
            800,

          fontSize:
            "0.85rem",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize:
            "2.5rem",

          fontWeight:
            900,

          color,

          marginTop:
            "5px",
        }}
      >
        {sgpa}
      </div>

      <p
        style={{
          margin:
            "4px 0 0",

          color:
            "#64748b",

          fontSize:
            "0.8rem",
        }}
      >
        {description}
      </p>
    </div>
  );
}


// ======================================================
// RECOMMENDATION CARD
// ======================================================

function RecommendationCard({
  item,
}) {
  return (
    <div
      style={{
        padding:
          "1rem",

        borderRadius:
          "12px",

        background:
          item.background,

        border:
          `1px solid ${item.color}33`,
      }}
    >
      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap: "10px",
        }}
      >

        <strong
          style={{
            color:
              "#0f172a",

            fontSize:
              "0.95rem",
          }}
        >
          {item.subjectName}
        </strong>

        <span
          style={{
            padding:
              "4px 9px",

            borderRadius:
              "999px",

            background:
              "#ffffff",

            color:
              item.color,

            fontSize:
              "0.7rem",

            fontWeight:
              900,
          }}
        >
          {item.risk}
        </span>
      </div>


      <p
        style={{
          margin:
            "8px 0",

          color:
            "#475569",

          fontSize:
            "0.85rem",

          lineHeight:
            1.5,
        }}
      >
        {item.suggestion}
      </p>


      <div
        style={{
          display:
            "flex",

          flexWrap:
            "wrap",

          gap: "8px",

          marginTop:
            "8px",
        }}
      >

        {item.recommendedIA2 && (
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "5px",

              padding:
                "6px 9px",

              background:
                "#ffffff",

              borderRadius:
                "8px",

              color:
                "#2563eb",

              fontSize:
                "0.75rem",

              fontWeight:
                800,
            }}
          >
            <Target
              size={14}
            />

            IA-2 Target:
            {" "}
            {item.recommendedIA2}/50
          </div>
        )}


        {item.recommendedStudyHours >
          0 && (
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "5px",

              padding:
                "6px 9px",

              background:
                "#ffffff",

              borderRadius:
                "8px",

              color:
                "#7c3aed",

              fontSize:
                "0.75rem",

              fontWeight:
                800,
            }}
          >
            <Clock
              size={14}
            />

            Study:
            {" "}
            {item.recommendedStudyHours}
            {" "}
            hrs/week
          </div>
        )}
      </div>
    </div>
  );
}


// ======================================================
// PROCESS STEP
// ======================================================

function ProcessStep({
  number,
  title,
  text,
}) {
  return (
    <div
      style={{
        padding:
          "12px",

        background:
          "#f8fafc",

        borderRadius:
          "10px",
      }}
    >
      <div
        style={{
          width:
            "28px",

          height:
            "28px",

          borderRadius:
            "50%",

          background:
            "#dbeafe",

          color:
            "#2563eb",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          fontWeight:
            900,

          fontSize:
            "0.8rem",

          marginBottom:
            "7px",
        }}
      >
        {number}
      </div>

      <strong
        style={{
          display:
            "block",

          color:
            "#0f172a",

          fontSize:
            "0.85rem",
        }}
      >
        {title}
      </strong>

      <span
        style={{
          display:
            "block",

          marginTop:
            "3px",

          color:
            "#64748b",

          fontSize:
            "0.75rem",

          lineHeight:
            1.4,
        }}
      >
        {text}
      </span>
    </div>
  );
}


// ======================================================
// STYLES
// ======================================================

const headerStyle = {
  padding:
    "13px 12px",

  textAlign:
    "center",

  color:
    "#64748b",

  fontSize:
    "0.75rem",

  fontWeight:
    800,
};


const cellStyle = {
  padding:
    "14px 12px",

  color:
    "#334155",

  fontSize:
    "0.88rem",
};


const inputStyle = {
  width:
    "82px",

  padding:
    "9px",

  borderRadius:
    "8px",

  border:
    "1px solid #cbd5e1",

  textAlign:
    "center",

  outline:
    "none",

  fontSize:
    "0.88rem",

  background:
    "#ffffff",
};