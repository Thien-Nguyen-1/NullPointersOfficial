import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import '../styles/LearningChart.css'; 
export default function LearningChart({ data }) {
  return (
    <div className="chart-card">
      <h2 className="chart-title">Your Learning Hours</h2>

      <div className="chart-container">
        <ResponsiveContainer width="95%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#666"
              axisLine={false}
              tickLine={false}
              padding={{ left: 5, right: 15 }}
            />
            <YAxis
              stroke="#666"
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              axisLine={false}
              tickLine={false}
              width={15}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#426751"
              strokeWidth={2}
              dot={{ fill: "#426751", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#426751" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

