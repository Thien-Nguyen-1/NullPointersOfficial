import React from "react";
import "../styles/CoursesList.css";

const tasks =[
    {title: "Know Your Values", progress: 2, button: "View Task"},
]

const TaskList = () => {
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




export default KnowValuesModule