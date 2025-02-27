import React from "react";
import "../styles/StatsCards.css"; // Import the CSS file

function StatsCards() {
  return (
    <div className="stats-cards-wrapper">
      <div className="greeting-card">
        <h1>Welcome, Max!</h1>
        <p>It's good to see you again.</p>
      </div>

      <div className="stat-card">
        <div>11</div>
        <p>Courses completed</p>
      </div>

      <div className="stat-card">
        <div>4</div>
        <p>Courses in progress</p>
      </div>
    </div>
  );
}

export default StatsCards;
