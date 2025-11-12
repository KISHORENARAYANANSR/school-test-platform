import React from "react";
import "../../styles/StatCard.css";

function StatCard({ title, value, subtitle, gradient }) {
  return (
    <div className="stat-card" style={{ background: gradient }}>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

export default StatCard;
