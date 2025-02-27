import React from "react";
import "../styles/CoursesList.css"; // Import styles
import { useNavigate } from 'react-router-dom';


const courses = [
  { title: "Coping with Anxiety", progress: 70, button: "Continue" },
  { title: "Dealing with Stress", progress: 70, button: "View Course" },
  { title: "Handling Depression", progress: 70, button: "View Course" },
  {title: "Know Your Values", progress: 70, button: "View Course",}
];

const CoursesList = () => {
  const navigate = useNavigate();

  const navigateToCourse = (courseTitle) => {
    if (courseTitle === "Know Your Values") {
      navigate("/worker/KnowValuesModule");
    }
    
  };

  return (
    <div className="courses-container">
      <h2>Your Courses</h2>
      {courses.map((course, index) => (
        <div key={index} className="course-card">
          <p>{course.title}</p>
          <button onClick={() => navigateToCourse(course.title)}>{course.button}</button>
        </div>
      ))}
    </div>
  );
};

export default CoursesList;
