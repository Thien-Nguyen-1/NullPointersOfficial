import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar"; 

import StatsCards from "../components/StatsCards";
import CoursesList from "../components/CoursesList";
import LearningChart from "../components/LearningChart";


function AdminDashboard() {
  return (
    <div className="flex">
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Stats, Courses, and Chart Components */}
        <StatsCards />
        <CoursesList />
        <LearningChart />

        {/* Admin-specific features */}
        <div className="mt-4 space-y-4">
          <Link to="/admin/create-module" className="block py-2 px-4 bg-blue-500 text-white rounded">Create Module</Link>
          <Link to="/admin/create-tag" className="block py-2 px-4 bg-blue-500 text-white rounded">Create Tag</Link>
          <Link to="/admin/patient-profiles" className="block py-2 px-4 bg-blue-500 text-white rounded">Patient Profiles</Link>
          <Link to="/admin/medical-professionals" className="block py-2 px-4 bg-blue-500 text-white rounded">Medical Professionals</Link>
        </div> 
      </div>
    </div>
  );
}

export default AdminDashboard;
