import React from "react";
import "../styles/CoursesList.css"; // Adjust the path as needed

export default function CoursesList({ courses }) {
  return (
    <div className="courses-card">
      <h2>Your Courses</h2>
      {/* Tabs */}
      <div className="tabs">
        <button className="active">In Progress</button>
        <button>Completed</button>
        <button>Saved Courses</button>
      </div>
      {/* Course list */}
      <div className="course-list">
        {courses.map((course, index) => (
          <div key={index} className="course-item">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <span className="course-title">{course.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div 
                className="circular-progress" 
                data-progress={`${course.progress}%`}
                style={{ '--progress': `${course.progress}%` }}
              >
                <div className="circular-progress-bar"></div>
              </div>
              <button>View Course</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}