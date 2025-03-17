import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout"; // Layout for authenticated pages
import Sidebar from "./components/Sidebar"; // Sidebar is applied only to dashboard pages
import { useParams } from "react-router-dom";


import AdminDashboard from "./pages/AdminDashboard";
// import MedicalProfessionalDashboard from "./pages/MedicalProfessionalDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Courses from "./pages/Courses";
import CoursesList from './pages/CoursesList.jsx';
import Questionnaire from "./components/Questionnaire";
import Login from './components/Login';
import Signup from './components/SignUp';
import Welcome from './components/Welcome';
import PasswordReset from './components/PasswordReset.jsx';
import RequestPasswordReset from './components/RequestPasswordReset.jsx';
import Tag from './components/Tag';
import Module2 from './pages/KnowValuesModule';
import ServiceUsersPage from "./pages/ServiceUsersPage";
import QuizContainer from './components/quizzes/QuizContainer';
import VisualFlashcardEditor from './components/editors/VisualFlashcardEditor';
import VisualFillTheFormEditor from './components/editors/VisualFillTheFormEditor';
import VisualFlowChartQuiz from './components/editors/VisualFlowChartQuiz';
import AddModule from './pages/AddModule';

import "./App.css";
import {AuthContextProvider} from './services/AuthContext.jsx'
import VerifyEmail from './components/VerifyEmail.jsx';


function App() {
  const QuizEditorSelector = () => {
    const { quizType } = useParams();
    
    return quizType === "flashcard" ? <VisualFlashcardEditor /> : <VisualStatementSequenceEditor />;
  };
  
  return (
    <AuthContextProvider> {/* User Context means no need to prop drill values in components - user data is accessible across all components*/}
    <Router>
      <Routes>
        {/* Auth Routes (No Sidebar) */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path = "/password-reset" element = {<RequestPasswordReset />} />
        <Route path = "/password-reset/:uidb64/:token" element = {<PasswordReset />} />
        <Route path="/tag" element={<Tag />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/settings" element={<Settings />} />

        {/* Temporary Quiz Route */}
        <Route path="/quiz/:taskId" element={<QuizContainer />} />  

        {/* Protected Routes (With Sidebar) */}
        <Route
          path="/worker/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="home" element={<WorkerDashboard />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
                <Route path="courses" element={<Courses/>} />
                <Route path="all-courses" element={<CoursesList/>} />
                <Route path="KnowValuesModule" element={<Module2/>} />
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
                <Route path="support" element={<Support />} />
                <Route path="courses" element={<Courses />} />
                <Route path="all-courses" element={<CoursesList role="admin" />} />
                <Route path="service-users" element={<ServiceUsersPage />} />
                <Route path="all-courses/create-and-manage-module" element={<AddModule />} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
    </AuthContextProvider>
  );
}

export default App;