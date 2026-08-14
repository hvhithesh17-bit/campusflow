// src/components/Header.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Header({ pageTitle, onMenuClick }) {
  const { currentUser } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            style={{
              padding: "6px 10px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            ☰
          </button>
        )}
        <h2 style={{ margin: 0, textTransform: "capitalize" }}>
          {pageTitle || "Dashboard"}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {currentUser && (
          <span style={{ fontSize: "14px", color: "#64748b" }}>
            {currentUser.email}
          </span>
        )}
      </div>
    </header>
  );
}