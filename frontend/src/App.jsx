import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
// import MedicalProfessionalDashboard from "./pages/MedicalProfessionalDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Settings from "./pages/Settings";
import Messaging from "./pages/Messaging";
import Courses from "./pages/Courses";
import Profile from "./pages/Profile";

// Import Dashboard Components
import StatsCards from "./components/StatsCards";
import CoursesList from "./components/CoursesList";
import LearningChart from "./components/LearningChart"; 

import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar Navigation */}
        <Sidebar /> {/* This Sidebar is applied to all pages */}

        {/* Main Content */}
        <main className="main-content"> {/* Content takes remaining space */}
          <Routes>
            {/* Redirect root to worker home by default */}
            <Route path="/" element={<Navigate to="/worker/home" />} />

            {/* Worker Dashboard as Home Page */}
            <Route path="/worker/home" element={<WorkerDashboard />} />
            {/* Admin Dashboard as Home Page */}
            <Route path="/admin/home" element={<AdminDashboard />} />

            {/* Settings Page Route */}
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/worker/settings" element={<Settings />} />

            {/* Messaging Page Route */}
            <Route path="/admin/messages" element={<Messaging />} />
            <Route path="/worker/messages" element={<Messaging />} />

            {/* Courses Page Route */}
            <Route path="/admin/courses" element={<Courses />} />
            <Route path="/worker/courses" element={<Courses />} />

            {/* Courses Page Route */}
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/worker/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
