import React from "react";
import "../styles/CoursesList.css"; // Import styles


const courses = [
  { title: "Coping with Anxiety", progress: 70, button: "Continue" },
  { title: "Dealing with Stress", progress: 70, button: "View Course" },
  { title: "Handling Depression", progress: 70, button: "View Course" },
];

const CoursesList = () => {
  return (
    <div className="courses-container">
      <h2>Your Courses</h2>
      {courses.map((course, index) => (
        <div key={index} className="course-card">
          <p>{course.title}</p>
          <button>{course.button}</button>
        </div>
      ))}
    </div>
  );
};

export default CoursesList;
