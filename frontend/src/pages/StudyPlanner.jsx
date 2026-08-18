// src/pages/StudyPlanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useLocation } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock, // Added missing Clock import
  Plus,
  Sparkles,
  Timer,
  Trash2,
  Target,
} from "lucide-react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  generateStudyRecommendations,
  getTodayDateString,
} from "../utils/studyRecommendations";
import { validateStudySession } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";
import SmartRecommendations from "../components/studyPlanner/SmartRecommendations";

export default function StudyPlanner() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const formRef = useRef(null);

  // Firestore Data State
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Messages
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(() => getTodayDateString());
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState("Medium");
  const [sgpaPrefill, setSgpaPrefill] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Action States
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [filterTab, setFilterTab] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg("");
    }, 3500);
  };

  // Prefill Form from SGPA / Other Pages
  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) {
      setSgpaPrefill(null);
      return;
    }

    setSgpaPrefill(prefill.source === "sgpa" ? prefill : null);

    if (prefill.subjectId) setSubjectId(prefill.subjectId);
    if (prefill.subjectName) setSubjectName(prefill.subjectName);
    if (prefill.topic) setTopic(prefill.topic);
    if (prefill.duration) setDuration(Number(prefill.duration));
    if (prefill.priority) setPriority(prefill.priority);
    setDate(getTodayDateString());

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    window.history.replaceState({}, document.title, window.location.href);
  }, [location.state]);

  // Firestore Real-Time Listeners
  useEffect(() => {
    if (!currentUser?.uid) {
      setSubjects([]);
      setAttendance([]);
      setAssignments([]);
      setStudySessions([]);
      setStudyGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const userId = currentUser.uid;
    const qSubjects = query(collection(db, "subjects"), where("userId", "==", userId));
    const qAttendance = query(collection(db, "attendance"), where("userId", "==", userId));
    const qAssignments = query(collection(db, "assignments"), where("userId", "==", userId));
    const qStudySessions = query(collection(db, "studySessions"), where("userId", "==", userId));
    const qStudyGoals = query(collection(db, "studyGoals"), where("userId", "==", userId));

    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 5) setLoading(false);
    };

    const unsubSub = onSnapshot(
      qSubjects,
      (s) => {
        setSubjects(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubAtt = onSnapshot(
      qAttendance,
      (s) => {
        setAttendance(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubAsg = onSnapshot(
      qAssignments,
      (s) => {
        setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubStd = onSnapshot(
      qStudySessions,
      (s) => {
        setStudySessions(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        markLoaded();
      },
      () => markLoaded()
    );

    const unsubGol = onSnapshot(
      qStudyGoals,
      (s) => {
        setStudyGoals(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        markLoaded();
      },
      () => markLoaded()
    );

    return () => {
      unsubSub();
      unsubAtt();
      unsubAsg();
      unsubStd();
      unsubGol();
    };
  }, [currentUser]);

  // Dynamic Recommendations
  const recommendations = useMemo(() => {
    return generateStudyRecommendations({
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals,
    });
  }, [subjects, attendance, assignments, studySessions, studyGoals]);

  const handleSelectRecommendation = (rec) => {
    if (!rec) return;
    if (rec.subjectId) setSubjectId(rec.subjectId);
    if (rec.subjectName) setSubjectName(rec.subjectName);
    if (rec.suggestedTopic) setTopic(rec.suggestedTopic);
    if (rec.recommendedDurationMinutes) setDuration(Number(rec.recommendedDurationMinutes));
    if (rec.priority) {
      setPriority(rec.priority === "HIGH" ? "High" : "Medium");
    }
    setDate(getTodayDateString());

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubjectDropdownChange = (e) => {
    const sId = e.target.value;
    setSubjectId(sId);
    const selected = subjects.find((s) => s.id === sId);
    setSubjectName(selected ? selected.name : "");
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!currentUser?.uid) {
      setError("You must be logged in to schedule a study session.");
      return;
    }

    const numericDuration = Number(duration) || 60;
    const validation = validateStudySession({
      subjectId: subjectId.trim(),
      topic: topic.trim(),
      date,
      durationMinutes: numericDuration,
      priority,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    let finalSubjectName = subjectName.trim();
    if (!finalSubjectName) {
      const match = subjects.find((s) => s.id === subjectId);
      finalSubjectName = match ? match.name : "Subject";
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "studySessions"), {
        userId: currentUser.uid,
        subjectId: subjectId.trim(),
        subjectName: finalSubjectName,
        topic: topic.trim(),
        date: date || getTodayDateString(),
        startTime: startTime || "18:00",
        durationMinutes: numericDuration,
        priority: priority || "Medium",
        source: sgpaPrefill?.source || "study-planner",
        targetIA2: sgpaPrefill?.targetIA2 != null ? Number(sgpaPrefill.targetIA2) : null,
        ia1Marks: sgpaPrefill?.ia1 != null ? Number(sgpaPrefill.ia1) : null,
        academicRisk: sgpaPrefill?.risk || null,
        status: "Scheduled",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showSuccess(`Study session "${topic.trim()}" scheduled successfully!`);
      setSubjectId("");
      setSubjectName("");
      setTopic("");
      setDuration(60);
      setPriority("Medium");
      setStartTime("18:00");
      setSgpaPrefill(null);
    } catch (err) {
      console.error("Error creating study session:", err);
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (session) => {
    setError("");
    setSuccessMsg("");

    if (!currentUser?.uid || session.userId !== currentUser.uid) {
      setError("Unauthorized action.");
      return;
    }

    const newStatus = session.status === "Completed" ? "Scheduled" : "Completed";
    setUpdatingId(session.id);

    try {
      const sessionRef = doc(db, "studySessions", session.id);
      await updateDoc(sessionRef, {
        status: newStatus,
        completedAt: newStatus === "Completed" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      showSuccess(
        newStatus === "Completed"
          ? `"${session.topic}" marked as completed!`
          : `"${session.topic}" moved back to scheduled.`
      );
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSession = (session) => {
    setError("");
    setSuccessMsg("");

    if (!currentUser?.uid || session.userId !== currentUser.uid) {
      setError("Unauthorized action.");
      return;
    }

    setDeleteTarget(session);
  };

  const confirmDeleteSession = async () => {
    if (!deleteTarget) return;

    const session = deleteTarget;
    setDeletingId(session.id);

    try {
      const sessionRef = doc(db, "studySessions", session.id);
      await deleteDoc(sessionRef);
      showSuccess(`"${session.topic}" deleted successfully.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const today = getTodayDateString();
    const todaySessions = studySessions.filter((s) => s.date === today);
    const completedSessions = studySessions.filter((s) => s.status === "Completed");

    const totalMinutes = studySessions.reduce((total, s) => {
      const mins = Number(s.durationMinutes || s.duration || 0);
      return total + (Number.isNaN(mins) ? 0 : mins);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const completionRate =
      studySessions.length > 0
        ? Math.round((completedSessions.length / studySessions.length) * 100)
        : 0;

    return {
      todayCount: todaySessions.length,
      completedCount: completedSessions.length,
      totalTimeFormatted: `${hours}h ${minutes}m`,
      completionRate,
    };
  }, [studySessions]);

  const todayDateStr = getTodayDateString();

  const filteredSessions = useMemo(() => {
    return [...studySessions]
      .filter((session) => {
        if (filterTab === "today") return session.date === todayDateStr;
        if (filterTab === "upcoming")
          return session.date >= todayDateStr && session.status !== "Completed";
        if (filterTab === "completed") return session.status === "Completed";
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "Completed" ? 1 : -1;
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }, [studySessions, filterTab, todayDateStr]);

  const getPriorityStyle = (lvl) => {
    switch (lvl) {
      case "High":
        return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
      case "Low":
        return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
      case "Medium":
      default:
        return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    }
  };

  const plannerStyles = `
  .planner-page{min-height:100%;padding:24px clamp(14px,3vw,32px) 40px;background:#f8fafc;color:#0f172a}
  .planner-shell{max-width:1240px;margin:auto}
  .planner-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px 30px;margin-bottom:16px;border:1px solid #dbeafe;border-radius:22px;background:linear-gradient(135deg,#fff 0%,#f8fbff 65%,#eff6ff 100%);box-shadow:0 8px 28px rgba(15,23,42,.05)}
  .planner-kicker{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
  .planner-hero h1{margin:10px 0 6px;font-size:clamp(1.6rem,3vw,2.25rem);letter-spacing:-.04em}
  .planner-hero p{margin:0;max-width:680px;color:#64748b;font-size:.86rem;line-height:1.65}
  .planner-today{padding:12px 15px;border:1px solid #dbeafe;border-radius:14px;background:rgba(255,255,255,.8);white-space:nowrap}
  .planner-today small{display:block;color:#64748b;font-size:.65rem;font-weight:800;text-transform:uppercase}.planner-today strong{display:block;margin-top:3px;color:#1e3a8a;font-size:.82rem}
  .planner-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
  .planner-stat{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #e2e8f0;border-radius:17px;background:#fff;box-shadow:0 4px 18px rgba(15,23,42,.035)}
  .planner-stat-icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border-radius:12px}
  .planner-stat small{display:block;color:#64748b;font-size:.68rem;font-weight:750}.planner-stat strong{display:block;margin-top:2px;font-size:1.22rem;letter-spacing:-.025em}
  .planner-alert{display:flex;gap:9px;align-items:flex-start;padding:12px 14px;margin-bottom:12px;border-radius:12px;font-size:.8rem}.planner-error{border:1px solid #fecaca;background:#fff5f5;color:#991b1b}.planner-success{border:1px solid #bbf7d0;background:#f0fdf4;color:#166534}.planner-alert button{margin-left:auto;border:0;background:transparent;color:inherit;font-size:17px;cursor:pointer}
  .planner-recommend{margin-bottom:16px}
  .planner-prefill{display:flex;gap:11px;padding:13px 15px;margin-bottom:16px;border:1px solid #bfdbfe;border-radius:15px;background:#eff6ff}.planner-prefill-icon{display:grid;place-items:center;width:36px;height:36px;flex:0 0 36px;border-radius:10px;background:#dbeafe;color:#2563eb}.planner-prefill strong{font-size:.82rem;color:#1e3a8a}.planner-prefill p{margin:3px 0 0;color:#475569;font-size:.76rem;line-height:1.45}
  .planner-form{padding:22px;margin-bottom:24px;border:1px solid #e2e8f0;border-radius:19px;background:#fff;box-shadow:0 7px 25px rgba(15,23,42,.04)}.planner-form h2{margin:0;color:#0f172a;font-size:1rem}.planner-form-sub{margin:4px 0 18px;color:#64748b;font-size:.74rem}
  .planner-form-grid{display:grid;grid-template-columns:1.15fr 1.4fr 1fr 1fr 1fr;gap:11px}.planner-label{display:block;margin-bottom:6px;color:#334155;font-size:.71rem;font-weight:800}.planner-input{width:100%;height:43px;box-sizing:border-box;padding:0 10px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;font:inherit;font-size:.8rem;outline:none}.planner-input:focus{border-color:#60a5fa;box-shadow:0 0 0 4px rgba(37,99,235,.09)}
  .planner-primary{display:inline-flex;align-items:center;gap:7px;margin-top:14px;min-height:41px;padding:0 15px;border:0;border-radius:9px;background:#2563eb;color:#fff;font:inherit;font-size:.77rem;font-weight:800;cursor:pointer;box-shadow:0 6px 16px rgba(37,99,235,.18)}.planner-primary:hover{background:#1d4ed8}
  .planner-list-head{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin-bottom:13px}.planner-list-head h2{margin:0;font-size:1.16rem;letter-spacing:-.025em}.planner-list-head p{margin:4px 0 0;color:#64748b;font-size:.73rem}
  .planner-tabs{display:flex;gap:3px;padding:4px;border:1px solid #e2e8f0;border-radius:10px;background:#f1f5f9}.planner-tab{padding:7px 11px;border:0;border-radius:7px;background:transparent;color:#64748b;font:inherit;font-size:.72rem;font-weight:700;cursor:pointer}.planner-tab.active{background:#fff;color:#2563eb;box-shadow:0 1px 4px rgba(15,23,42,.08)}
  .planner-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:13px}.planner-card{display:flex;flex-direction:column;min-height:225px;padding:17px;border:1px solid #e2e8f0;border-radius:17px;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,.035);transition:.18s}.planner-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(15,23,42,.07)}.planner-card.done{background:#f8fafc}
  .planner-card-top{display:flex;justify-content:space-between;gap:8px}.planner-subject{max-width:68%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 8px;border-radius:999px;background:#eff6ff;border:1px solid #dbeafe;color:#1d4ed8;font-size:.64rem;font-weight:800}.planner-priority{padding:5px 8px;border-radius:999px;font-size:.62rem;font-weight:800;text-transform:uppercase}
  .planner-topic{margin:13px 0 10px;font-size:.97rem;line-height:1.4;letter-spacing:-.01em}.planner-topic.done{text-decoration:line-through;color:#64748b}.planner-meta{display:grid;grid-template-columns:1fr 1fr;gap:7px}.planner-meta-item{display:flex;align-items:center;gap:5px;padding:7px 8px;border-radius:8px;background:#f8fafc;border:1px solid #f1f5f9;color:#64748b;font-size:.68rem}
  .planner-card-actions{display:flex;gap:7px;align-items:center;margin-top:auto;padding-top:12px;border-top:1px solid #f1f5f9}.planner-complete{flex:1;min-height:35px;border:1px solid #86efac;border-radius:8px;background:#dcfce7;color:#15803d;font:inherit;font-size:.7rem;font-weight:800;cursor:pointer}.planner-complete.done{border-color:#cbd5e1;background:#f8fafc;color:#475569}.planner-delete{width:35px;height:35px;border:1px solid #fecaca;border-radius:8px;background:#fff5f5;color:#dc2626;cursor:pointer}
  .planner-empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:25px;border:1px dashed #cbd5e1;border-radius:17px;background:#fff}.planner-empty-icon{display:grid;place-items:center;width:52px;height:52px;margin-bottom:12px;border-radius:14px;background:#eff6ff;color:#3b82f6}.planner-empty h3{margin:0 0 5px;font-size:.95rem}.planner-empty p{margin:0;color:#64748b;font-size:.77rem}
  .planner-skeletons{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:13px}.planner-skeleton{height:225px;border-radius:17px;background:linear-gradient(90deg,#eef2f7 25%,#f8fafc 50%,#eef2f7 75%);background-size:200% 100%;animation:plannerShimmer 1.2s infinite}@keyframes plannerShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
  .planner-modal-backdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(4px)}.planner-modal{width:min(100%,410px);padding:22px;border-radius:18px;background:#fff;box-shadow:0 25px 60px rgba(15,23,42,.24)}.planner-modal-icon{display:grid;place-items:center;width:44px;height:44px;margin-bottom:12px;border-radius:12px;background:#fef2f2;color:#dc2626}.planner-modal h3{margin:0 0 6px;font-size:1rem}.planner-modal p{margin:0;color:#64748b;font-size:.8rem;line-height:1.5}.planner-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:19px}.planner-cancel,.planner-confirm{min-height:38px;padding:0 12px;border-radius:8px;font:inherit;font-size:.73rem;font-weight:800;cursor:pointer}.planner-cancel{border:1px solid #cbd5e1;background:#fff;color:#334155}.planner-confirm{display:inline-flex;align-items:center;gap:6px;border:1px solid #fecaca;background:#fff5f5;color:#dc2626}
  @media(max-width:1050px){.planner-form-grid{grid-template-columns:repeat(3,1fr)}.planner-form-grid>div:nth-child(2){grid-column:span 2}}@media(max-width:720px){.planner-hero{align-items:flex-start;flex-direction:column}.planner-stats{grid-template-columns:1fr}.planner-form-grid{grid-template-columns:1fr 1fr}.planner-form-grid>div:nth-child(2){grid-column:auto}.planner-list-head{align-items:stretch;flex-direction:column}.planner-tabs{width:max-content;max-width:100%;overflow:auto}}@media(max-width:500px){.planner-page{padding:12px}.planner-hero{padding:21px;border-radius:18px}.planner-form{padding:16px}.planner-form-grid{grid-template-columns:1fr}.planner-grid{grid-template-columns:1fr}.planner-tabs{width:100%}.planner-tab{flex:1}.planner-modal-actions{flex-direction:column-reverse}.planner-modal-actions button{width:100%}}
`;

  return (
    <>
      <style>{plannerStyles}</style>
      <main className="planner-page">
        <div className="planner-shell">
          <section className="planner-hero">
            <div>
              <span className="planner-kicker">
                <CalendarDays size={12} /> Academic Focus
              </span>
              <h1>Study Planner & Roadmap</h1>
              <p>
                Plan focused study sessions, follow smart recommendations, and achieve your academic targets with a clear daily routine.
              </p>
            </div>
            <div className="planner-today">
              <small>Today</small>
              <strong>{todayDateStr}</strong>
            </div>
          </section>

          <section className="planner-stats">
            <div className="planner-stat">
              <div className="planner-stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <Calendar size={19} />
              </div>
              <div>
                <small>Today's Sessions</small>
                <strong>{metrics.todayCount}</strong>
              </div>
            </div>
            <div className="planner-stat">
              <div className="planner-stat-icon" style={{ background: "#f8fafc", color: "#334155" }}>
                <Timer size={19} />
              </div>
              <div>
                <small>Planned Study Time</small>
                <strong>{metrics.totalTimeFormatted}</strong>
              </div>
            </div>
            <div className="planner-stat">
              <div className="planner-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <CheckCircle size={19} />
              </div>
              <div>
                <small>Completion Rate</small>
                <strong style={{ color: "#16a34a" }}>{metrics.completionRate}%</strong>
              </div>
            </div>
          </section>

          {error && (
            <div className="planner-alert planner-error">
              <AlertCircle size={17} />
              <span>{error}</span>
              <button onClick={() => setError("")}>×</button>
            </div>
          )}
          {successMsg && (
            <div className="planner-alert planner-success">
              <CheckCircle2 size={17} />
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")}>×</button>
            </div>
          )}

          <div className="planner-recommend">
            <SmartRecommendations
              recommendations={recommendations}
              onSelectRecommendation={handleSelectRecommendation}
              loading={loading}
            />
          </div>

          {sgpaPrefill && (
            <div className="planner-prefill">
              <div className="planner-prefill-icon">
                <Target size={18} />
              </div>
              <div>
                <strong>SGPA Recommendation Applied</strong>
                <p>
                  {sgpaPrefill.subjectName || "This subject"} needs priority attention.
                  {sgpaPrefill.targetIA2 && ` Target IA-2: ${sgpaPrefill.targetIA2}/50.`}
                  {sgpaPrefill.studyHours && ` Recommended: ${sgpaPrefill.studyHours} hrs/week.`}
                </p>
              </div>
            </div>
          )}

          <section ref={formRef} className="planner-form">
            <h2>
              <Sparkles size={17} color="#2563eb" style={{ verticalAlign: "-3px", marginRight: 7 }} />
              Schedule a Study Session
            </h2>
            <p className="planner-form-sub">
              Create a specific session with a subject, target, time and priority.
            </p>
            <form onSubmit={handleCreateSession}>
              <div className="planner-form-grid">
                <div>
                  <label className="planner-label">Course / Subject *</label>
                  <select
                    className="planner-input"
                    value={subjectId}
                    onChange={handleSubjectDropdownChange}
                    disabled={submitting}
                    required
                  >
                    <option value="">Choose subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="planner-label">Study Topic / Target *</label>
                  <input
                    className="planner-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Dynamic Programming & Trees"
                    disabled={submitting}
                    required
                  />
                </div>
                <div>
                  <label className="planner-label">Date *</label>
                  <input
                    className="planner-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div>
                  <label className="planner-label">Start Time</label>
                  <input
                    className="planner-input"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="planner-label">Duration</label>
                  <select
                    className="planner-input"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    disabled={submitting}
                  >
                    <option value={30}>30 min · Sprint</option>
                    <option value={45}>45 min · Focus</option>
                    <option value={60}>60 min · Standard</option>
                    <option value={90}>90 min · Deep Work</option>
                    <option value={120}>120 min · Intensive</option>
                  </select>
                </div>
              </div>
              <div style={{ maxWidth: 220, marginTop: 12 }}>
                <label className="planner-label">Priority</label>
                <select
                  className="planner-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={submitting}
                >
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>
              </div>
              <button type="submit" className="planner-primary" disabled={submitting}>
                <Plus size={15} />
                {submitting ? "Adding Session..." : "Add Study Session"}
              </button>
            </form>
          </section>

          <section>
            <div className="planner-list-head">
              <div>
                <h2>Study Schedule</h2>
                <p>
                  {filteredSessions.length} of {studySessions.length} sessions shown
                </p>
              </div>
              <div className="planner-tabs">
                {["all", "today", "upcoming", "completed"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`planner-tab ${filterTab === tab ? "active" : ""}`}
                    onClick={() => setFilterTab(tab)}
                  >
                    {tab === "all"
                      ? "All"
                      : tab === "today"
                        ? "Today"
                        : tab === "upcoming"
                          ? "Upcoming"
                          : "Completed"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="planner-skeletons">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div className="planner-skeleton" key={i} />
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="planner-empty">
                <div className="planner-empty-icon">
                  <CalendarDays size={23} />
                </div>
                <h3>No study sessions in this view</h3>
                <p>Schedule your first session above or choose from smart recommendations.</p>
              </div>
            ) : (
              <div className="planner-grid">
                {filteredSessions.map((session) => {
                  const isCompleted = session.status === "Completed";
                  const isDeleting = deletingId === session.id;
                  const isUpdating = updatingId === session.id;
                  const pStyle = getPriorityStyle(session.priority);
                  return (
                    <article
                      className={`planner-card ${isCompleted ? "done" : ""}`}
                      key={session.id}
                    >
                      <div>
                        <div className="planner-card-top">
                          <span className="planner-subject">
                            {session.subjectName || "Subject"}
                          </span>
                          <span
                            className="planner-priority"
                            style={{
                              color: pStyle.color,
                              background: pStyle.bg,
                              border: `1px solid ${pStyle.border}`,
                            }}
                          >
                            {session.priority || "Medium"}
                          </span>
                        </div>
                        <h3 className={`planner-topic ${isCompleted ? "done" : ""}`}>
                          {session.topic}
                        </h3>
                        <div className="planner-meta">
                          <div className="planner-meta-item">
                            <Calendar size={12} />
                            {session.date}
                          </div>
                          <div className="planner-meta-item">
                            <Timer size={12} />
                            {session.durationMinutes || session.duration || 60} min
                          </div>
                          <div className="planner-meta-item">
                            <Clock size={12} />
                            {session.startTime || "Flexible"}
                          </div>
                          <div className="planner-meta-item">
                            <Target size={12} />
                            {isCompleted ? "Completed" : "Planned"}
                          </div>
                        </div>
                      </div>
                      <div className="planner-card-actions">
                        <button
                          type="button"
                          className={`planner-complete ${isCompleted ? "done" : ""}`}
                          onClick={() => handleToggleStatus(session)}
                          disabled={isUpdating || isDeleting}
                        >
                          <Check size={13} />
                          {isCompleted ? "Mark Planned" : "Mark Complete"}
                        </button>
                        <button
                          type="button"
                          className="planner-delete"
                          onClick={() => handleDeleteSession(session)}
                          disabled={isUpdating || isDeleting}
                          title="Delete session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {deleteTarget && (
        <div
          className="planner-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            className="planner-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="planner-delete-title"
          >
            <div className="planner-modal-icon">
              <Trash2 size={20} />
            </div>
            <h3 id="planner-delete-title">Delete study session?</h3>
            <p>
              <strong>{deleteTarget.topic}</strong> will be permanently removed from your study schedule.
            </p>
            <div className="planner-modal-actions">
              <button
                type="button"
                className="planner-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="planner-confirm"
                onClick={confirmDeleteSession}
                disabled={Boolean(deletingId)}
              >
                <Trash2 size={13} />
                {deletingId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}