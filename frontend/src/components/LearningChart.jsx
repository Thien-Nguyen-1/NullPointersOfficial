import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./LearningChart.css"; // Import styles

const data = [
  { day: "Mon", hours: 1 },
  { day: "Tue", hours: 2 },
  { day: "Wed", hours: 1 },
  { day: "Thu", hours: 3 },
  { day: "Fri", hours: 5 },
  { day: "Sat", hours: 7 },
  { day: "Sun", hours: 6 },
];

const LearningChart = () => {
  return (
    <div className="chart-container">
      <h2>Your Learning Hours</h2>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="hours" stroke="#FFD700" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LearningChart;
