import React, { useState } from "react";
import "../styles/CoursesList.css";

export default function CoursesList({ courses }) {
  const [activeTab, setActiveTab] = useState("In Progress");
  
  // Filter courses based on active tab
  const filteredCourses = courses.filter(course => {
    if (activeTab === "In Progress") {
      return course.progress > 0 && course.progress < 100;
    } else if (activeTab === "Completed") {
      return course.progress === 100;
    } else if (activeTab === "Saved Courses") {
      return course.pinned === true;
    }
    return false;
  });

  // Handle tab click
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className="courses-card">
      <h2>Your Courses</h2>
      <div className="tabs">
        <button 
          className={activeTab === "In Progress" ? "active" : ""} 
          onClick={() => handleTabClick("In Progress")}
        >
          In Progress
        </button>
        <button 
          className={activeTab === "Completed" ? "active" : ""} 
          onClick={() => handleTabClick("Completed")}
        >
          Completed
        </button>
        <button 
          className={activeTab === "Saved Courses" ? "active" : ""} 
          onClick={() => handleTabClick("Saved Courses")}
        >
          Saved Courses
        </button>
      </div>
      <div className="course-list">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course, index) => (
            <div key={index} className="course-item">
              <div className="course-info">
                <div className="icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  </svg>
                </div>
                <span className="course-title">{course.title}</span>
              </div>
              <div className="course-progress">
                <div className="circular-progress">
                  <svg viewBox="0 0 36 36" className="circular-svg">
                    <path
                      d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#426751"
                      strokeWidth="3"
                      strokeDasharray={`${course.progress}, 100`}
                    />
                  </svg>
                  <span className="progress-text">{course.progress}%</span>
                </div>
                <button onClick={() => window.location.href = `/course/${course.id}`}>
                  View Course
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No courses found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}