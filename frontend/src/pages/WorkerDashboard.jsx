
import StatsCards from "../components/StatsCards";
import CoursesList from "../components/CoursesList";
import LearningChart from "../components/LearningChart";


function WorkerDashboard() {
  return (
    <div className="dashboard-container">
            <h1 className="page-title">Worker Dashboard</h1>
    
            {/* Stats, Courses, and Chart Components */}
            <StatsCards />
            <CoursesList />
            <LearningChart />
    </div>
  );
};
  
export default WorkerDashboard;
  