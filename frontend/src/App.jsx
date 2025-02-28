import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout"; // Layout for authenticated pages
import Sidebar from "./components/Sidebar"; // Sidebar is applied only to dashboard pages

import AdminDashboard from "./pages/AdminDashboard";
// import MedicalProfessionalDashboard from "./pages/MedicalProfessionalDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Settings from "./pages/Settings";
import Messaging from "./pages/Messaging";
import Courses from "./pages/Courses";
import Profile from "./pages/Profile";
import Questionnaire from "./components/Questionnaire";
import CreateModule from "./pages/CreateModule";
import Login from './components/Login';
import Signup from './components/SignUp';
import Welcome from './components/Welcome';
import ChangePassword from './components/ChangePassword';
import Tag from './components/Tag';
import Module2 from './pages/KnowValuesModule';

import "./App.css";



function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes (No Sidebar) */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path = "/change-password" element = {<ChangePassword />} />
        <Route path="/tag" element={<Tag />} />
        <Route path="/questionnaire" element={<Questionnaire />} />

        {/* Protected Routes (With Sidebar) */}
        <Route
          path="/worker/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="home" element={<WorkerDashboard />} />
                <Route path="settings" element={<Settings />} />
                <Route path="messages" element={<Messaging />} />
                <Route path="courses" element={<Courses role="worker" />} />
                <Route path="profile" element={<Profile />} />
                <Route path="KnowValuesModule" element={<Module2 role="worker" />} />
              </Routes>
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="home" element={<AdminDashboard />} />
                <Route path="settings" element={<Settings />} />
                <Route path="messages" element={<Messaging />} />
                <Route path="courses" element={<Courses role="admin" />} />
                <Route path="profile" element={<Profile />} />
                <Route path="create-module" element={<CreateModule />} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
