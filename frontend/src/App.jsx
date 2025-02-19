import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
// import MedicalProfessionalDashboard from "./pages/MedicalProfessionalDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";

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
        <main className="main-content"> {/* ✅ Content takes remaining space */}
          <h1 style={{ color: "white" }}>🚀 React App is Working</h1>
          <Routes>
            {/* Redirect root to worker home by default */}
            <Route path="/" element={<Navigate to="/worker/home" />} />

            {/* Worker Dashboard as Home Page */}
            <Route path="/worker/home" element={<WorkerDashboard />} />

            {/* Admin Dashboard as Home Page */}
            <Route path="/admin/home" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
