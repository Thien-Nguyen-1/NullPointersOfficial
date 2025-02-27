import React from "react";
import StatsCards from "../components/StatsCards"; // Adjust the path as necessary
import LearningChart from "../components/LearningChart"; // Adjust the path as necessary
import CoursesList from "../components/CoursesList"; // Adjust the path as necessary

function WorkerDashboard() {
  const courses = [
    { title: "Coping with Anxiety", progress: 70, action: "View Course" },
    { title: "Dealing with Stress", progress: 50, action: "View Course" },
    { title: "Handling Depression", progress: 10, action: "View Course" }
  ];

  const learningHours = [
    { day: "Mon", hours: 2.0 },
    { day: "Tue", hours: 3.7 },
    { day: "Wed", hours: 0.8 },
    { day: "Thu", hours: 3.8 },
    { day: "Fri", hours: 2.0 },
    { day: "Sat", hours: 1.0 },
    { day: "Sun", hours: 3.2 }
  ];

  return (
    <div className="dashboard-container">
      {/* Top Row */}
      <div className="top-row">
        <StatsCards />
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <CoursesList courses={courses} />
        <LearningChart data={learningHours} />
      </div>
    </div>
  );
}

export default WorkerDashboard;
