import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
// import MedicalProfessionalDashboard from "./pages/MedicalProfessionalDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Settings from "./pages/Settings";
import Messaging from "./pages/Messaging";
import Courses from "./pages/Courses";
import Profile from "./pages/Profile";
import CreateModule from "./pages/CreateModule";


import "./App.css";
import Login from './components/Login';
import Signup from './components/SignUp';
import Welcome from './components/Welcome';
import Tag from './components/Tag';



function App() {
  return (
    <Router>
      <Routes>
        <Route path = "/" element = {<Welcome />} />
        <Route path = "/login" element = {<Login />} />
        <Route path = "/signup" element = {<Signup />} />
        <Route path = "/tag" element = {<Tag />}/>
      </Routes>
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
            <Route path="/admin/courses" element={<Courses role="admin" />} />
            <Route path="/worker/courses" element={<Courses role="worker" />} />

            {/* Courses Page Route */}
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/worker/profile" element={<Profile />} />


            <Route path="/admin/create-module" element={<CreateModule />} /> 

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
