import React from "react";
import "../styles/CoursesList.css";
import KnowValuesTaskList from "../components/KnowValuesTaskList";

function Module2(){
  return(

    <div className="dashboard-container">
            <h1 className="page-title">Worker Dashboard</h1>
    
            {/* Stats, Tasks for module 2, and Chart Components */}
            <StatsCards />
            <KnowValuesTaskList/>
            <LearningChart />
    </div>


  )
}


export default KnowValuesModule