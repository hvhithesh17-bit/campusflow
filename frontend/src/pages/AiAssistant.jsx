// src/pages/AiAssistant.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { buildAcademicContext } from "../utils/aiContextBuilder";
import { validateAiPrompt } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";
import {
  Bot,
  User,
  Send,
  Sparkles,
  HelpCircle,
  AlertCircle,
  RotateCcw,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  Flame,
  Brain,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export default function AiAssistant() {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Firestore collections state
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");

  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      id: "welcome-msg",
      sender: "ai",
      text: `Hello! I am your CampusFlow AI Academic Assistant. I have loaded your live course records, attendance percentages, assignment deadlines, and study roadmap. How can I assist your study strategy today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const chatBottomRef = useRef(null);

  // Handle prefill prompts forwarded from Academic Risk Analysis / Dashboard
  useEffect(() => {
    if (location.state?.prompt) {
      setInputQuery(location.state.prompt);
    }
  }, [location.state]);

  // Parallel real-time subscriptions to Firestore
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setDbError("");

    const qSub = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    const qAtt = query(collection(db, "attendance"), where("userId", "==", currentUser.uid));
    const qAsg = query(collection(db, "assignments"), where("userId", "==", currentUser.uid));
    const qStd = query(collection(db, "studySessions"), where("userId", "==", currentUser.uid));
    const qGol = query(collection(db, "studyGoals"), where("userId", "==", currentUser.uid));

    let count = 0;
    const checkDone = () => {
      count += 1;
      if (count >= 5) setLoading(false);
    };

    const unsubSub = onSnapshot(
      qSub,
      (s) => {
        setSubjects(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        checkDone();
      },
      (err) => {
        setDbError(formatFirebaseError(err));
        checkDone();
      }
    );

    const unsubAtt = onSnapshot(
      qAtt,
      (s) => {
        setAttendance(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        checkDone();
      },
      (err) => {
        setDbError(formatFirebaseError(err));
        checkDone();
      }
    );

    const unsubAsg = onSnapshot(
      qAsg,
      (s) => {
        setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        checkDone();
      },
      (err) => {
        setDbError(formatFirebaseError(err));
        checkDone();
      }
    );

    const unsubStd = onSnapshot(
      qStd,
      (s) => {
        setStudySessions(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        checkDone();
      },
      (err) => {
        setDbError(formatFirebaseError(err));
        checkDone();
      }
    );

    const unsubGol = onSnapshot(
      qGol,
      (s) => {
        setStudyGoals(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        checkDone();
      },
      (err) => {
        setDbError(formatFirebaseError(err));
        checkDone();
      }
    );

    return () => {
      unsubSub();
      unsubAtt();
      unsubAsg();
      unsubStd();
      unsubGol();
    };
  }, [currentUser]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  // Aggregate user's academic context
  const academicContext = useMemo(() => {
    return buildAcademicContext({
      currentUser,
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals,
    });
  }, [currentUser, subjects, attendance, assignments, studySessions, studyGoals]);

  // Compute live context stats
  const contextStats = useMemo(() => {
    const totalAssignments = assignments.filter((a) => a.status !== "Completed").length;
    const lowAttCount = attendance.filter((a) => (Number(a.percentage) || 0) < 75).length;
    return {
      coursesCount: subjects.length,
      pendingTasks: totalAssignments,
      lowAttendanceCount: lowAttCount,
    };
  }, [subjects, assignments, attendance]);

  const quickQuestions = [
    "What should I study today?",
    "Which subject needs attention?",
    "Analyze my attendance health",
    "Review my pending assignments",
    "How can I improve my SGPA?",
    "Create an exam prep roadmap",
  ];

  // Send query to AI endpoint with validation
  const handleSendMessage = async (textToSend) => {
    const rawText = textToSend || inputQuery;
    setValidationError("");

    const validation = validateAiPrompt(rawText);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    const questionText = validation.sanitizedPrompt;
    if (isReplying) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setIsReplying(true);
    setLastFailedQuery(null);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          academicContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reach AI server.");
      }

      const botMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setLastFailedQuery(questionText);
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        isError: true,
        text: `⚠️ Request could not be completed. Make sure your local AI server (port 5000) is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        padding: "2rem 2.5rem",
        boxSizing: "border-box",
        minHeight: "100%",
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
              }}
            >
              <Brain size={22} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Academic AI Assistant
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Context-aware academic intelligence powered by Gemini 2.5 and your live semester records.
          </p>
        </div>
      </div>

      {/* Live Synced Context Badges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Active Courses
            </span>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
              {contextStats.coursesCount} Enrolled
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#fffbeb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
            }}
          >
            <Flame size={18} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Pending Tasks
            </span>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d97706" }}>
              {contextStats.pendingTasks} Assignments
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: contextStats.lowAttendanceCount > 0 ? "#fef2f2" : "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: contextStats.lowAttendanceCount > 0 ? "#dc2626" : "#16a34a",
            }}
          >
            <CalendarCheck size={18} />
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Attendance Health
            </span>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: contextStats.lowAttendanceCount > 0 ? "#dc2626" : "#16a34a",
              }}
            >
              {contextStats.lowAttendanceCount > 0 ? `${contextStats.lowAttendanceCount} At-Risk` : "Safe (≥75%)"}
            </div>
          </div>
        </div>
      </div>

      {/* Database Error Banner */}
      {dbError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "10px",
            marginBottom: "1.25rem",
            border: "1px solid #fecaca",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={18} />
          <span>{dbError}</span>
        </div>
      )}

      {/* Prompt Validation Alert */}
      {validationError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fffbeb",
            color: "#b45309",
            borderRadius: "8px",
            marginBottom: "1rem",
            border: "1px solid #fde68a",
            fontSize: "0.85rem",
          }}
        >
          <AlertCircle size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Quick Starter Prompts */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#64748b",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Sparkles size={14} color="#2563eb" /> Suggested Inquiries
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              disabled={isReplying}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: isReplying ? "not-allowed" : "pointer",
                opacity: isReplying ? 0.6 : 1,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          height: "560px",
          boxShadow: "0 4px 20px -4px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Messages List */}
        <div
          style={{
            flex: 1,
            padding: "1.5rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            backgroundColor: "#f8fafc",
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: msg.isError ? "#fef2f2" : "#eff6ff",
                      color: msg.isError ? "#dc2626" : "#2563eb",
                      border: `1px solid ${msg.isError ? "#fecaca" : "#bfdbfe"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "75%",
                    padding: "12px 16px",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: isUser ? "#2563eb" : "#ffffff",
                    color: isUser ? "#ffffff" : msg.isError ? "#991b1b" : "#0f172a",
                    border: isUser
                      ? "none"
                      : msg.isError
                      ? "1px solid #fca5a5"
                      : "1px solid #e2e8f0",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <div>{msg.text}</div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      marginTop: "6px",
                      textAlign: "right",
                      color: isUser ? "rgba(255,255,255,0.75)" : "#94a3b8",
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })}

          {isReplying && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#64748b",
                fontSize: "0.85rem",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                }}
              >
                <Sparkles size={16} />
              </div>
              <span>CampusFlow AI is synthesizing your study strategy...</span>
            </div>
          )}

          {lastFailedQuery && !isReplying && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => handleSendMessage(lastFailedQuery)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid #fca5a5",
                  backgroundColor: "#ffffff",
                  color: "#dc2626",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <RotateCcw size={13} /> Retry Question
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Form Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            gap: "0.75rem",
            backgroundColor: "#ffffff",
          }}
        >
          <input
            type="text"
            placeholder="Ask about revision scheduling, upcoming tests, or attendance health..."
            value={inputQuery}
            onChange={(e) => {
              setInputQuery(e.target.value);
              if (validationError) setValidationError("");
            }}
            disabled={isReplying}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.9rem",
              outline: "none",
              color: "#0f172a",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isReplying}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.75rem 1.5rem",
              borderRadius: "10px",
              border: "none",
              backgroundColor: !inputQuery.trim() || isReplying ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: !inputQuery.trim() || isReplying ? "not-allowed" : "pointer",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.15)",
              transition: "all 0.15s ease",
            }}
          >
            <Send size={15} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}