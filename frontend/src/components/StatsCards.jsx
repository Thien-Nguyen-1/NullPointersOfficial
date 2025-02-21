import React from "react";
import { FaFire } from "react-icons/fa"; // Import fire icon
import "../styles/StatsCards.css";

const StatsCards = () => {
  return (
    <div className="stats-container">
      <div className="stat-card greeting">
        <p>Hello <strong>Max!</strong></p>
        <p>It's good to see you again.</p>
      </div>
      <div className="stat-card">
        <p className="stat-number">11</p>
        <p>Courses Completed</p>
      </div>
      <div className="stat-card">
        <p className="stat-number">4</p>
        <p>Courses in Progress</p>
      </div>
      <div className="stat-card fire">
        <FaFire className="fire-icon" />
        <p className="stat-number">7</p>
      </div>
    </div>
  );
};

export default StatsCards;
