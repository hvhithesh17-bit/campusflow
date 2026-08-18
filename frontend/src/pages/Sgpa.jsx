// src/pages/Sgpa.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
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
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  GraduationCap,
  RotateCcw,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { generateAcademicRecommendations } from "../utils/academicRecommendations";

// ======================================================
// VTU GRADE SCALE
// ======================================================
const GRADE_SCALE = [
  { min: 90, grade: "O", point: 10 },
  { min: 80, grade: "A+", point: 9 },
  { min: 70, grade: "A", point: 8 },
  { min: 60, grade: "B+", point: 7 },
  { min: 55, grade: "B", point: 6 },
  { min: 50, grade: "C", point: 5 },
  { min: 40, grade: "P", point: 4 },
  { min: 0, grade: "F", point: 0 },
];

const getGradeFromMarks = (marks) => {
  if (
    marks === null ||
    marks === undefined ||
    marks === "" ||
    Number.isNaN(Number(marks))
  ) {
    return { grade: "-", point: 0 };
  }

  for (const item of GRADE_SCALE) {
    if (Number(marks) >= item.min) {
      return { grade: item.grade, point: item.point };
    }
  }

  return { grade: "F", point: 0 };
};

const calculateCIE = (ia1, ia2) => {
  if (ia1 === "" || ia1 === null || ia1 === undefined) {
    return null;
  }

  const first = Number(ia1);
  if (Number.isNaN(first)) return null;

  if (ia2 === "" || ia2 === null || ia2 === undefined) {
    return first;
  }

  const second = Number(ia2);
  if (Number.isNaN(second)) return first;

  return (first + second) / 2;
};

const getRisk = (percentage) => {
  if (percentage >= 80) {
    return { level: "LOW", label: "Excellent", color: "#16a34a", background: "#f0fdf4", border: "#bbf7d0" };
  }
  if (percentage >= 60) {
    return { level: "MEDIUM", label: "Needs Attention", color: "#d97706", background: "#fffbeb", border: "#fde68a" };
  }
  return { level: "HIGH", label: "Needs Improvement", color: "#dc2626", background: "#fef2f2", border: "#fecaca" };
};

const getGradeBadgeStyle = (grade) => {
  switch (grade) {
    case "O":
    case "A+":
    case "A":
      return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    case "B+":
    case "B":
      return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
    case "C":
    case "P":
      return { bg: "#fffbeb", color: "#b45309", border: "#fde68a" };
    case "F":
      return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    default:
      return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  }
};

export default function SGPA() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [iaMarks, setIaMarks] = useState({});
  const [targetSgpaInput, setTargetSgpaInput] = useState("9.0");

  // 1. Load subjects from Firebase
  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedSubjects = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setSubjects(fetchedSubjects);

        const initialMarks = {};
        fetchedSubjects.forEach((sub) => {
          initialMarks[sub.id] = {
            ia1: sub.ia1 ?? "",
            ia2: sub.ia2 ?? "",
          };
        });

        setIaMarks(initialMarks);
        setLoading(false);
      },
      (err) => {
        console.error("Firebase Error in Sgpa:", err);
        setError("Failed to fetch subjects.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleIAMarkChange = (subjectId, field, value) => {
    if (value === "") {
      setIaMarks((prev) => ({
        ...prev,
        [subjectId]: {
          ...prev[subjectId],
          [field]: "",
        },
      }));
      return;
    }

    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > 50) return;

    setIaMarks((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: num,
      },
    }));
  };

  const handleResetMarks = () => {
    const reset = {};
    subjects.forEach((sub) => {
      reset[sub.id] = {
        ia1: sub.ia1 ?? "",
        ia2: sub.ia2 ?? "",
      };
    });
    setIaMarks(reset);
    setError("");
  };

  const handleSaveIA = async (subjectId) => {
    const marks = iaMarks[subjectId] || {};
    const ia1 = marks.ia1 === "" || marks.ia1 === undefined ? null : Number(marks.ia1);
    const ia2 = marks.ia2 === "" || marks.ia2 === undefined ? null : Number(marks.ia2);

    if (ia1 !== null && (ia1 < 0 || ia1 > 50)) {
      setError("IA-1 must be between 0 and 50.");
      return;
    }

    if (ia2 !== null && (ia2 < 0 || ia2 > 50)) {
      setError("IA-2 must be between 0 and 50.");
      return;
    }

    try {
      setSavingId(subjectId);
      setError("");

      await updateDoc(doc(db, "subjects", subjectId), {
        ia1,
        ia2,
        iaUpdatedAt: serverTimestamp(),
      });

      setSavedId(subjectId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error("Error saving IA:", err);
      setError("Failed to save IA marks.");
    } finally {
      setSavingId(null);
    }
  };

  // SGPA Prediction
  const prediction = useMemo(() => {
    const calculateScenario = (seePercentage) => {
      let totalCredits = 0;
      let totalQualityPoints = 0;
      const results = [];

      subjects.forEach((subject) => {
        const credits = Number(subject.credits) || 0;
        if (credits <= 0) return;

        const marks = iaMarks[subject.id] || {};
        const ia1 = marks.ia1;
        const ia2 = marks.ia2;

        if (ia1 === "" || ia1 === null || ia1 === undefined) return;

        const cie = calculateCIE(ia1, ia2);
        if (cie === null) return;

        const seeMarks = (seePercentage / 100) * 50;
        const estimatedFinalMarks = cie + seeMarks;
        const grade = getGradeFromMarks(estimatedFinalMarks);

        totalCredits += credits;
        totalQualityPoints += credits * grade.point;

        const iaPercentage = (Number(ia1) / 50) * 100;
        const risk = getRisk(iaPercentage);

        results.push({
          id: subject.id,
          name: subject.name || subject.subjectName || "Subject",
          credits,
          ia1,
          ia2,
          cie,
          estimatedFinalMarks,
          grade: grade.grade,
          gradePoint: grade.point,
          weightedPoints: credits * grade.point,
          risk,
        });
      });

      return {
        sgpa: totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : "0.00",
        totalCredits,
        totalQualityPoints,
        results,
      };
    };

    return {
      conservative: calculateScenario(40),
      expected: calculateScenario(70),
      best: calculateScenario(90),
    };
  }, [subjects, iaMarks]);

  // Overall IA-1 Average & Academic Risk
  const analysis = useMemo(() => {
    let total = 0;
    let count = 0;

    subjects.forEach((subject) => {
      const marks = iaMarks[subject.id];
      if (
        marks &&
        marks.ia1 !== "" &&
        marks.ia1 !== undefined &&
        marks.ia1 !== null
      ) {
        total += Number(marks.ia1);
        count += 1;
      }
    });

    if (count === 0) {
      return { average: null, entered: 0, total: subjects.length, risk: null };
    }

    const avg = total / count;
    const percentage = (avg / 50) * 100;

    return {
      average: avg,
      entered: count,
      total: subjects.length,
      risk: getRisk(percentage),
    };
  }, [subjects, iaMarks]);

  // Grade distribution based on expected SEE scenario
  const gradeDistribution = useMemo(() => {
    const counts = { O: 0, "A+": 0, A: 0, "B+": 0, B: 0, C: 0, P: 0, F: 0 };
    let totalAssessed = 0;

    prediction.expected.results.forEach((item) => {
      if (item.grade && counts[item.grade] !== undefined) {
        counts[item.grade] += 1;
        totalAssessed += 1;
      }
    });

    return { counts, totalAssessed };
  }, [prediction.expected.results]);

  // Improvement insights: list subjects sorted by lowest grade points
  const subjectsToImprove = useMemo(() => {
    return [...prediction.expected.results]
      .filter((sub) => sub.gradePoint < 8)
      .sort((a, b) => a.gradePoint - b.gradePoint);
  }, [prediction.expected.results]);

  // Smart Academic Recommendations
  const academicRecommendations = useMemo(() => {
    return generateAcademicRecommendations(subjects);
  }, [subjects]);

  const handleApplyToStudyPlanner = (item) => {
    navigate("/study-planner", {
      state: {
        prefill: {
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          topic: `IA-2 Prep: ${item.subjectName}`,
          priority: item.priority === "HIGH" ? "High" : "Medium",
          duration: item.studyHours ? Math.min(item.studyHours * 60, 120) : 60,
          source: "sgpa",
          targetIA2: item.targetIA2,
          ia1: item.ia1,
          risk: item.risk,
          studyHours: item.studyHours,
        },
      },
    });
  };

  const currentNumericSgpa = Number(prediction.expected.sgpa) || 0;
  const sgpaProgressPercent = Math.min(Math.max((currentNumericSgpa / 10) * 100, 0), 100);
  const targetNumericSgpa = Number(targetSgpaInput) || 9.0;
  const sgpaDifference = (targetNumericSgpa - currentNumericSgpa).toFixed(2);

  const styles = `
    .sgpa-root {
      min-height: 100%;
      padding: 24px clamp(16px, 3.2vw, 36px) 48px;
      background: #f8fafc;
      color: #0f172a;
      box-sizing: border-box;
      font-family: inherit;
    }
    .sgpa-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .sgpa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 24px 28px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
    }
    .sgpa-header-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .sgpa-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      color: #1d4ed8;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: fit-content;
    }
    .sgpa-header h1 {
      margin: 4px 0 0;
      font-size: clamp(1.4rem, 2.5vw, 1.85rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
    }
    .sgpa-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    .sgpa-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 0.825rem;
    }
    .sgpa-alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .sgpa-alert-info {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    .sgpa-alert-close {
      margin-left: auto;
      background: transparent;
      border: none;
      color: inherit;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
    }

    /* Top Summary Grid */
    .sgpa-summary-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 18px;
      margin-bottom: 24px;
    }
    .sgpa-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
    }
    .sgpa-main-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
    }
    .sgpa-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .sgpa-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }
    .sgpa-score-display {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 8px 0;
    }
    .sgpa-score-val {
      font-size: clamp(2.4rem, 4.5vw, 3.2rem);
      font-weight: 900;
      letter-spacing: -0.04em;
      color: #2563eb;
      line-height: 1;
    }
    .sgpa-score-max {
      font-size: 1.15rem;
      font-weight: 700;
      color: #94a3b8;
    }

    /* Progress bar */
    .sgpa-progress-track {
      width: 100%;
      height: 10px;
      background: #f1f5f9;
      border-radius: 999px;
      overflow: hidden;
      margin: 12px 0 6px;
    }
    .sgpa-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .sgpa-progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
    }

    /* Key stats mini-grid */
    .sgpa-metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }
    .sgpa-metric-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .sgpa-metric-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sgpa-metric-value {
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* Target & Formula column */
    .sgpa-side-column {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .sgpa-target-box {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
    }
    .sgpa-target-input {
      width: 90px;
      height: 38px;
      padding: 0 10px;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      outline: none;
    }
    .sgpa-target-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .sgpa-formula-calc {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-top: 10px;
      text-align: center;
    }
    .sgpa-formula-item small {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .sgpa-formula-item strong {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
    }
    .sgpa-formula-op {
      font-size: 1.1rem;
      font-weight: 700;
      color: #94a3b8;
    }

    /* Scenarios row */
    .sgpa-scenarios-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .sgpa-scenario-card {
      padding: 16px 18px;
      border-radius: 14px;
      border: 1px solid;
    }
    .sgpa-scenario-label {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .sgpa-scenario-score {
      font-size: 1.7rem;
      font-weight: 900;
      margin: 4px 0 2px;
      letter-spacing: -0.03em;
    }
    .sgpa-scenario-sub {
      margin: 0;
      font-size: 0.75rem;
    }

    /* Academic recommendations */
    .sgpa-recs-wrapper {
      margin-bottom: 24px;
    }
    .sgpa-rec-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 14px;
      margin-top: 10px;
    }
    .sgpa-rec-schedule-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .sgpa-rec-schedule-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    /* Grade distribution pills */
    .sgpa-grades-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .sgpa-grade-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 0.75rem;
    }
    .sgpa-grade-pill strong {
      font-weight: 800;
      color: #0f172a;
    }
    .sgpa-grade-pill span {
      color: #64748b;
      font-size: 0.7rem;
    }

    /* Table Section */
    .sgpa-table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
      overflow: hidden;
      margin-bottom: 24px;
    }
    .sgpa-table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      border-bottom: 1px solid #e2e8f0;
      gap: 12px;
      flex-wrap: wrap;
    }
    .sgpa-table-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sgpa-btn-sm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .sgpa-btn-outline {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
    }
    .sgpa-btn-outline:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .sgpa-table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    .sgpa-table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
      text-align: left;
    }
    .sgpa-table th {
      padding: 12px 16px;
      font-size: 0.73rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .sgpa-table td {
      padding: 12px 16px;
      font-size: 0.83rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .sgpa-table tr:last-child td {
      border-bottom: none;
    }
    .sgpa-input-table {
      width: 68px;
      height: 34px;
      padding: 0 6px;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      font-size: 0.82rem;
      font-weight: 600;
      text-align: center;
      color: #0f172a;
      box-sizing: border-box;
      outline: none;
    }
    .sgpa-input-table:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .sgpa-grade-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      text-align: center;
    }
    .sgpa-risk-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .sgpa-save-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      min-width: 68px;
      height: 32px;
      padding: 0 10px;
      border: none;
      border-radius: 7px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
      cursor: pointer;
      transition: background 0.15s;
    }

    /* Improvement highlights */
    .sgpa-improve-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .sgpa-improve-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border: 1px solid #fed7aa;
      border-radius: 12px;
      background: #fffbeb;
    }

    /* Skeleton Loading */
    .sgpa-skeleton {
      height: 48px;
      border-radius: 8px;
      background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: sgpaShimmer 1.2s infinite;
      margin-bottom: 8px;
    }
    @keyframes sgpaShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty state */
    .sgpa-empty {
      padding: 44px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .sgpa-empty-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: #eff6ff;
      color: #2563eb;
      display: grid;
      place-items: center;
      margin-bottom: 12px;
    }

    @media (max-width: 980px) {
      .sgpa-summary-grid {
        grid-template-columns: 1fr;
      }
      .sgpa-scenarios-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .sgpa-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .sgpa-metrics-row {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .sgpa-rec-item {
        flex-direction: column;
        align-items: flex-start;
      }
      .sgpa-rec-schedule-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  return (
    <div className="sgpa-root">
      <style>{styles}</style>
      <div className="sgpa-container">

        {/* 1. PAGE HEADER */}
        <header className="sgpa-header">
          <div className="sgpa-header-info">
            <span className="sgpa-badge">
              <Calculator size={13} /> Semester Evaluation
            </span>
            <h1>SGPA Calculator & Academic Forecast</h1>
            <p>
              Calculate your semester performance and understand how each subject affects your SGPA.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleResetMarks}
              className="sgpa-btn-sm sgpa-btn-outline"
              title="Reset unsaved IA marks"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="sgpa-alert sgpa-alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
            <button
              type="button"
              className="sgpa-alert-close"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Top Summary & Target Grid */}
        <div className="sgpa-summary-grid">

          {/* 2 & 3. SGPA SUMMARY CARD & PERFORMANCE INDICATOR */}
          <section className="sgpa-card sgpa-main-card">
            <div>
              <div className="sgpa-card-head">
                <div className="sgpa-card-title">
                  <Award size={18} color="#2563eb" />
                  <span>Predicted Expected SGPA</span>
                </div>
                {analysis.risk && (
                  <span
                    className="sgpa-risk-tag"
                    style={{
                      background: analysis.risk.background,
                      color: analysis.risk.color,
                      border: `1px solid ${analysis.risk.border}`,
                    }}
                  >
                    {analysis.risk.label}
                  </span>
                )}
              </div>

              <div className="sgpa-score-display">
                <span className="sgpa-score-val">
                  {analysis.average !== null ? prediction.expected.sgpa : "0.00"}
                </span>
                <span className="sgpa-score-max">/ 10.00</span>
              </div>

              {/* Performance Indicator Bar */}
              <div className="sgpa-progress-track" aria-label="SGPA Progress indicator">
                <div
                  className="sgpa-progress-fill"
                  style={{ width: `${sgpaProgressPercent}%` }}
                />
              </div>
              <div className="sgpa-progress-labels">
                <span>0.0 (Scale Min)</span>
                <span>Current: {analysis.average !== null ? prediction.expected.sgpa : "0.00"}</span>
                <span>10.0 (Max)</span>
              </div>
            </div>

            {/* Metrics Mini-Grid */}
            <div className="sgpa-metrics-row">
              <div className="sgpa-metric-box">
                <span className="sgpa-metric-label">Total Credits</span>
                <span className="sgpa-metric-value">{prediction.expected.totalCredits}</span>
              </div>
              <div className="sgpa-metric-box">
                <span className="sgpa-metric-label">Subjects</span>
                <span className="sgpa-metric-value">{subjects.length}</span>
              </div>
              <div className="sgpa-metric-box">
                <span className="sgpa-metric-label">IA-1 Average</span>
                <span className="sgpa-metric-value" style={{ color: "#2563eb" }}>
                  {analysis.average !== null ? `${analysis.average.toFixed(1)}/50` : "—"}
                </span>
              </div>
              <div className="sgpa-metric-box">
                <span className="sgpa-metric-label">Quality Pts</span>
                <span className="sgpa-metric-value">
                  {prediction.expected.totalQualityPoints.toFixed(1)}
                </span>
              </div>
            </div>
          </section>

          {/* 6 & 7. TARGET SGPA & FORMULA CARD */}
          <div className="sgpa-side-column">

            {/* Target SGPA */}
            <section className="sgpa-card">
              <div className="sgpa-card-head">
                <div className="sgpa-card-title">
                  <Target size={17} color="#2563eb" />
                  <span>Target SGPA Goal</span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>
                  Semester Goal
                </span>
              </div>

              <div className="sgpa-target-box">
                <div>
                  <label
                    htmlFor="sgpa-target-input"
                    style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#64748b", marginBottom: 3 }}
                  >
                    Target
                  </label>
                  <input
                    id="sgpa-target-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={targetSgpaInput}
                    onChange={(e) => setTargetSgpaInput(e.target.value)}
                    className="sgpa-target-input"
                    aria-label="Target SGPA"
                  />
                </div>
                <div style={{ flex: 1, fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                  {analysis.average !== null ? (
                    Number(sgpaDifference) <= 0 ? (
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>
                        ✓ Goal achieved! You are on track for {targetNumericSgpa.toFixed(2)}.
                      </span>
                    ) : (
                      <span>
                        Need <strong>+{sgpaDifference}</strong> SGPA point improvement via IA-2 and SEE exams.
                      </span>
                    )
                  ) : (
                    <span>Enter your IA-1 marks to calculate the gap to your target.</span>
                  )}
                </div>
              </div>
            </section>

            {/* SGPA Formula Card */}
            <section className="sgpa-card" style={{ padding: "16px 20px" }}>
              <div className="sgpa-card-head">
                <div className="sgpa-card-title" style={{ fontSize: "0.85rem" }}>
                  <Layers size={15} color="#2563eb" />
                  <span>VTU SGPA Calculation</span>
                </div>
                <code style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>
                  Σ(Ci × Gi) / Σ(Ci)
                </code>
              </div>

              <div className="sgpa-formula-calc">
                <div className="sgpa-formula-item">
                  <small>Points Σ(C×G)</small>
                  <strong>{prediction.expected.totalQualityPoints.toFixed(0)}</strong>
                </div>
                <div className="sgpa-formula-op">÷</div>
                <div className="sgpa-formula-item">
                  <small>Credits Σ(C)</small>
                  <strong>{prediction.expected.totalCredits || 0}</strong>
                </div>
                <div className="sgpa-formula-op">=</div>
                <div className="sgpa-formula-item">
                  <small>Est. SGPA</small>
                  <strong style={{ color: "#2563eb" }}>{prediction.expected.sgpa}</strong>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Prediction Scenarios */}
        {analysis.average !== null && (
          <section style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Sparkles size={16} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                Predicted Semester Exam Scenarios
              </h3>
            </div>

            <div className="sgpa-scenarios-grid">
              {/* Conservative */}
              <div
                className="sgpa-scenario-card"
                style={{ background: "#fef2f2", borderColor: "#fecaca" }}
              >
                <span className="sgpa-scenario-label" style={{ color: "#991b1b" }}>
                  Conservative
                </span>
                <div className="sgpa-scenario-score" style={{ color: "#dc2626" }}>
                  {prediction.conservative.sgpa}
                </div>
                <p className="sgpa-scenario-sub" style={{ color: "#7f1d1d" }}>
                  Assumes ~40% performance in final SEE exams
                </p>
              </div>

              {/* Expected */}
              <div
                className="sgpa-scenario-card"
                style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
              >
                <span className="sgpa-scenario-label" style={{ color: "#1e40af" }}>
                  Expected Target
                </span>
                <div className="sgpa-scenario-score" style={{ color: "#2563eb" }}>
                  {prediction.expected.sgpa}
                </div>
                <p className="sgpa-scenario-sub" style={{ color: "#1e3a8a" }}>
                  Assumes ~70% performance in final SEE exams
                </p>
              </div>

              {/* Best Case */}
              <div
                className="sgpa-scenario-card"
                style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
              >
                <span className="sgpa-scenario-label" style={{ color: "#166534" }}>
                  Optimistic (Best Case)
                </span>
                <div className="sgpa-scenario-score" style={{ color: "#16a34a" }}>
                  {prediction.best.sgpa}
                </div>
                <p className="sgpa-scenario-sub" style={{ color: "#14532d" }}>
                  Assumes ~90% performance in final SEE exams
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 5. GRADE DISTRIBUTION */}
        {gradeDistribution.totalAssessed > 0 && (
          <section className="sgpa-card" style={{ marginBottom: "24px" }}>
            <div className="sgpa-card-head">
              <div className="sgpa-card-title">
                <GraduationCap size={17} color="#2563eb" />
                <span>Estimated Grade Distribution (Expected SEE)</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {gradeDistribution.totalAssessed} courses assessed
              </span>
            </div>

            <div className="sgpa-grades-strip">
              {Object.entries(gradeDistribution.counts).map(([gradeKey, count]) => {
                const badgeStyle = getGradeBadgeStyle(gradeKey);
                return (
                  <div
                    key={gradeKey}
                    className="sgpa-grade-pill"
                    style={{
                      background: count > 0 ? badgeStyle.bg : "#f8fafc",
                      borderColor: count > 0 ? badgeStyle.border : "#e2e8f0",
                    }}
                  >
                    <strong style={{ color: count > 0 ? badgeStyle.color : "#94a3b8" }}>
                      {gradeKey}
                    </strong>
                    <span>{count} {count === 1 ? "course" : "courses"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 8. IMPROVEMENT INSIGHTS */}
        {subjectsToImprove.length > 0 && (
          <section className="sgpa-card" style={{ marginBottom: "24px" }}>
            <div className="sgpa-card-head">
              <div className="sgpa-card-title">
                <TrendingUp size={17} color="#d97706" />
                <span>Where to Improve (Priority Courses)</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700 }}>
                High impact on SGPA
              </span>
            </div>
            <div className="sgpa-improve-grid">
              {subjectsToImprove.map((item) => (
                <div key={item.id} className="sgpa-improve-card">
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>
                      {item.name}
                    </strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      Current CIE: {item.cie?.toFixed(1)} / 50 · {item.credits} Credits
                    </span>
                  </div>
                  <span
                    className="sgpa-grade-tag"
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                    }}
                  >
                    Grade {item.grade}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CampusFlow Smart Academic Recommendations */}
        {academicRecommendations.length > 0 && (
          <section className="sgpa-card sgpa-recs-wrapper">
            <div className="sgpa-card-head">
              <div className="sgpa-card-title">
                <Lightbulb size={18} color="#d97706" />
                <span>Personalized Academic Recommendations</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Identified from IA-1 score patterns
              </span>
            </div>

            <div>
              {academicRecommendations.map((item) => {
                const isHigh = item.priority === "HIGH";
                return (
                  <div
                    key={item.subjectId}
                    className="sgpa-rec-item"
                    style={{
                      backgroundColor: isHigh ? "#fff1f2" : "#fffbeb",
                      border: `1px solid ${isHigh ? "#fecdd3" : "#fde68a"}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                          {item.subjectName}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "4px",
                            backgroundColor: isHigh ? "#dc2626" : "#d97706",
                            color: "#ffffff",
                          }}
                        >
                          {item.priority} PRIORITY
                        </span>
                      </div>

                      <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                        {item.message}
                        {item.targetIA2 && ` Target IA-2: ${item.targetIA2}/50.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyToStudyPlanner(item)}
                      className="sgpa-rec-schedule-btn"
                    >
                      <Clock size={13} />
                      <span>Schedule Study</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Info Notice */}
        <div className="sgpa-alert sgpa-alert-info">
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Prediction Disclaimer:</strong> The SGPA shown is an estimated preview combining your IA marks and assumed SEE percentages. Final official SGPA is issued by VTU upon semester evaluation.
          </div>
        </div>

        {/* 4. SUBJECT PERFORMANCE TABLE */}
        <section className="sgpa-table-card">
          <div className="sgpa-table-header">
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                Course-wise Internal Assessment & SGPA Points
              </h3>
              <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "0.78rem" }}>
                Enter IA-1 scores now. Add IA-2 later to automatically recalculate CIE and grade points.
              </p>
            </div>
            <div className="sgpa-table-actions">
              <span style={{ fontSize: "0.73rem", color: "#64748b", fontStyle: "italic" }}>
                ← Scroll on small screens →
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "20px" }}>
              <div className="sgpa-skeleton" />
              <div className="sgpa-skeleton" />
              <div className="sgpa-skeleton" />
            </div>
          ) : subjects.length === 0 ? (
            /* 10. EMPTY STATE */
            <div className="sgpa-empty">
              <div className="sgpa-empty-icon">
                <BookOpen size={24} />
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "1rem", color: "#0f172a" }}>
                Add your subjects to calculate SGPA
              </h4>
              <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.82rem", maxWidth: "360px" }}>
                You have not registered any courses yet. Add courses with their credit weights to start tracking.
              </p>
              <Link
                to="/subjects"
                className="sgpa-btn-sm"
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                }}
              >
                Register Subjects <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="sgpa-table-responsive">
              <table className="sgpa-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th style={{ textAlign: "center" }}>Credits</th>
                    <th style={{ textAlign: "center" }}>IA-1 / 50</th>
                    <th style={{ textAlign: "center" }}>IA-2 / 50</th>
                    <th style={{ textAlign: "center" }}>CIE</th>
                    <th style={{ textAlign: "center" }}>Grade</th>
                    <th style={{ textAlign: "center" }}>Points</th>
                    <th style={{ textAlign: "center" }}>Risk</th>
                    <th style={{ textAlign: "center", width: "90px" }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {subjects.map((subject) => {
                    const marks = iaMarks[subject.id] || {};
                    const cie = calculateCIE(marks.ia1, marks.ia2);
                    const expected = prediction.expected.results.find(
                      (item) => item.id === subject.id
                    );
                    const risk =
                      marks.ia1 !== "" && marks.ia1 !== undefined && marks.ia1 !== null
                        ? getRisk((Number(marks.ia1) / 50) * 100)
                        : null;
                    const isSaving = savingId === subject.id;
                    const isSaved = savedId === subject.id;
                    const gradeBadge = expected ? getGradeBadgeStyle(expected.grade) : null;

                    return (
                      <tr key={subject.id}>
                        {/* Course Name */}
                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            {subject.name || subject.subjectName || "Subject"}
                          </div>
                          {subject.code && (
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              {subject.code}
                            </span>
                          )}
                        </td>

                        {/* Credits */}
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#475569" }}>
                          {subject.credits || 0}
                        </td>

                        {/* IA-1 */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={marks.ia1 ?? ""}
                            placeholder="0-50"
                            onChange={(e) => handleIAMarkChange(subject.id, "ia1", e.target.value)}
                            className="sgpa-input-table"
                            aria-label={`IA 1 marks for ${subject.name || "Subject"}`}
                          />
                        </td>

                        {/* IA-2 */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={marks.ia2 ?? ""}
                            placeholder="Later"
                            onChange={(e) => handleIAMarkChange(subject.id, "ia2", e.target.value)}
                            className="sgpa-input-table"
                            aria-label={`IA 2 marks for ${subject.name || "Subject"}`}
                          />
                        </td>

                        {/* CIE */}
                        <td style={{ textAlign: "center", fontWeight: 800, color: "#2563eb" }}>
                          {cie !== null ? cie.toFixed(1) : "—"}
                        </td>

                        {/* Grade */}
                        <td style={{ textAlign: "center" }}>
                          {expected && gradeBadge ? (
                            <span
                              className="sgpa-grade-tag"
                              style={{
                                background: gradeBadge.bg,
                                color: gradeBadge.color,
                                border: `1px solid ${gradeBadge.border}`,
                              }}
                            >
                              {expected.grade}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Grade Points / Weighted */}
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#334155" }}>
                          {expected ? (
                            <span>{expected.gradePoint} <small style={{ color: "#94a3b8" }}>({expected.weightedPoints}w)</small></span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Risk */}
                        <td style={{ textAlign: "center" }}>
                          {risk ? (
                            <span
                              className="sgpa-risk-tag"
                              style={{
                                backgroundColor: risk.background,
                                color: risk.color,
                                border: `1px solid ${risk.border}`,
                              }}
                            >
                              {risk.level}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Save Button */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleSaveIA(subject.id)}
                            disabled={isSaving}
                            className="sgpa-save-btn"
                            style={{
                              backgroundColor: isSaved ? "#16a34a" : "#2563eb",
                              opacity: isSaving ? 0.7 : 1,
                            }}
                            title="Save IA marks to database"
                          >
                            {isSaving ? (
                              "..."
                            ) : isSaved ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <Save size={13} />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}