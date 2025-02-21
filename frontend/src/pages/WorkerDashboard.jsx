
import StatsCards from "../components/StatsCards";
import CoursesList from "../components/CoursesList";
import LearningChart from "../components/LearningChart";


function WorkerDashboard() {
  return (
    <div className="flex">
          <div className="flex-1 p-6">
            <h1 className="text-2xl font-bold">Worker Dashboard</h1>
    
            {/* Stats, Courses, and Chart Components */}
            <StatsCards />
            <CoursesList />
            <LearningChart />
          </div>
    </div>
  );
};
  
export default WorkerDashboard;
  