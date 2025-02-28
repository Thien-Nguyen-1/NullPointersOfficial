import React from "react";
import "../styles/StatsCards.css"; 

export default function StatsCards({ userName, completedModules, inProgressModules }) {
  return (
    <div className="stats-cards-wrapper">
      <div className="greeting-card">
        <h1>Welcome, {userName}!</h1>
        <p>It's good to see you again.</p>
      </div>

      <div className="stat-card">
        <div>{completedModules}</div>
        <p>Courses completed</p>
      </div>

      <div className="stat-card">
        <div>{inProgressModules}</div>
        <p>Courses in progress</p>
      </div>
    </div>
  );
}
