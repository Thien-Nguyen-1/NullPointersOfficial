import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout"; // Layout for authenticated pages
import Sidebar from "./components/Sidebar"; // Sidebar is applied only to dashboard pages
import { useParams } from "react-router-dom";


import AdminDashboard from "./pages/AdminDashboard";
// import MedicalProfessionalDashboard from "./pages/MedicalProfessionalDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Settings from "./pages/Settings";
import Messaging from "./pages/Messaging";
import Courses from "./pages/Courses";
import Profile from "./pages/Profile";
import Questionnaire from "./components/Questionnaire";
import CreateModule from "./pages/CreateModule";
import QuizEditor from './pages/QuizEditor';
import Login from './components/Login';
import Signup from './components/SignUp';
import Welcome from './components/Welcome';
import ChangePassword from './components/ChangePassword';
import Tag from './components/Tag';
import Module2 from './pages/KnowValuesModule';
import QuizContainer from './components/quizzes/QuizContainer';
import VisualFlashcardEditor from './components/editors/VisualFlashcardEditor';
import VisualFillTheFormEditor from './components/editors/VisualFillTheFormEditor';
import VisualFlowChartQuiz from './components/editors/VisualFlowChartQuiz';
import VisualQuestionAndAnswerFormEditor from './components/editors/VisualQuestionAndAnswerFormEditor';
import AddModule from './pages/AddModule';

import "./App.css";



function App() {
  const QuizEditorSelector = () => {
    const { quizType } = useParams();
    
    return quizType === "flashcard" ? <VisualFlashcardEditor /> : <VisualStatementSequenceEditor />;
  };
  
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

        {/* Temporary Quiz Route */}
        <Route path="/quiz" element={<Navigate to="/admin/courses" />} />
        <Route path="/quiz/:taskId" element={<QuizContainer />} />  

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
                <Route path="courses/create-module" element={<CreateModule />} />
                {/* Conditional Routing for Editors Based on quizType */}
                <Route path="courses/create-module/:moduleId/:quizType" element={<QuizEditorSelector />} />
                {/* Add Fill-in-the-Blank Quiz Editor */}
                <Route path="courses/create-module/fill-in-the-blanks" element={<VisualFillTheFormEditor />} />
                <Route path="courses/create-module/flow-chart-quiz" element={<VisualFlowChartQuiz />} />
                <Route path="courses/create-module/question-and-answer-form" element={<VisualQuestionAndAnswerFormEditor/>} />
                <Route path="courses/create-and-manage-module" element={<AddModule />} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
