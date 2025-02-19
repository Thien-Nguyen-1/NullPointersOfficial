
import StatsCards from "../components/StatsCards";
import CoursesList from "../components/CoursesList";
import LearningChart from "../components/LearningChart";
import "../App.css";

function WorkerDashboard() {
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Worker Dashboard</h1>
      <div className="stats-container">
        <StatsCards />
      </div>
      <div className="courses-container">
        <CoursesList />
      </div>
      <div className="chart-container">
        <LearningChart />
      </div>
    </div>
  );
};
  
export default WorkerDashboard;
  