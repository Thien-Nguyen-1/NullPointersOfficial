import React from "react";
import "../styles/CoursesList.css";

const tasks =[
    {title: "Know Your Values", progress: 2, button: "View Task"},
    {title: "Be,Do, and Have", progress: 3, button: "View Task"},
]

const KnowValuesTaskList = () => {
    return (
      <div className="courses-container">
        <h2>Your Tasks</h2>
        {tasks.map((task, index) => (
          <div key={index} className="course-card">
            <p>{task.title}</p>
            <button>{task.button}</button>
          </div>
        ))}
      </div>
    );
  };




export default KnowValuesTaskList