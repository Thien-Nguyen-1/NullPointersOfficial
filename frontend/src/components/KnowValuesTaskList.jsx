import React from "react";
import "../styles/CoursesList.css";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';


const tasks =[
    {title: "Know Your Values", progress: 20, button: "View Task"},
    {title: "Be,Do, and Have Exercise", progress: 89, button: "View Task"},
]

const KnowValuesTaskList = () => {
    return (
      <div className="courses-container">
        <h2>Your Tasks</h2>
        {tasks.map((task, index) => (
          <div key={index} className="course-card">
            <p>{task.title}</p>
            <div style={{ width: 80, height: 80 }} className="progress-circle">
                        <CircularProgressbar value={task.progress} text={`${task.progress}%`} />
            </div>
            <button>{task.button}</button>
          </div>
        ))}
      </div>
    );
  };




export default KnowValuesTaskList