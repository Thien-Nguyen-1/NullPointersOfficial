import React, { useState, useContext, useEffect, useRef }from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout"; // Layout for authenticated pages
import Sidebar from "./components/Sidebar"; // Sidebar is applied only to dashboard pages
import { useSessionTimeout } from "./hooks-custom/useSessionTimeout";
import { SessionManager } from "./hooks-custom/useSessionManager";
import { useParams } from "react-router-dom";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import AdminDashboard from "./pages/AdminDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import Settings from './pages/Settings';
import Support from "./pages/Support";
import Courses from "./pages/Courses";
import CoursesList from './pages/CoursesList.jsx';
import Questionnaire from "./components/Questionnaire";
import UserQuestionnaire from './pages/UserQuestionnaire.jsx';
import Login from './components/auth/Login';
import Signup from './components/auth/SignUp';
import Welcome from './components/auth/Welcome';
import PasswordReset from './components/auth/PasswordReset.jsx';
import RequestPasswordReset from './components/auth/RequestPasswordReset.jsx';
import Tag from './components/Tag';
import ModuleViewAlternative from './components/ModuleViewAlternative.jsx';
import Messaging from './pages/Messaging.jsx';
import ServiceUsersPage from "./pages/ServiceUsersPage";
import DropZoneTest from './pages/DropZone.jsx';
import QuizContainer from './components/quizzes/QuizContainer';

import ProtectedSuperAdminRoute from './components/superadmin-settings/ProtectedSuperAdminRoute.jsx';
import SuperAdminSettings from './pages/SuperAdminSettings.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

import AddModule from './pages/AddModule';
import VerifyEmail from './components/auth/VerifyEmail.jsx';
import VerifyAdminEmail from './components/admin/VerifyAdminEmail.jsx';
import QuestionnaireAdmin from './pages/questionnaire-admin.jsx'

import NotificationOverlay from './overlays/notifications.jsx';

import "./App.css";

import { AuthContext, AuthContextProvider } from './services/AuthContext.jsx'
import { EnrollmentContextProvider } from './services/EnrollmentContext';
import { SuperAdminContextProvider } from './contexts/SuperAdminContext.jsx';
import { PreviewModeProvider } from './services/PreviewModeContext.jsx';


const LocationWrapper = () => {
  const location = useLocation(); 

  return <NotificationOverlay currentRoute={location} />;
};


function App() {


  return (
    <AuthContextProvider> 
      <SuperAdminContextProvider>
        <PreviewModeProvider>
          <EnrollmentContextProvider>
            <Router>
              <Routes>
                {/* Auth Routes (No Sidebar) */}
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/verify-admin-email/:token" element={<VerifyAdminEmail />} />
                <Route path="/password-reset" element={<RequestPasswordReset />} />
                <Route path="/password-reset/:uidb64/:token" element={<PasswordReset />} />
                <Route path="/tag" element={<Tag />} />
                <Route path="/questionnaire" element={<Questionnaire />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/worker/questionnaire" element={<UserQuestionnaire />} />

                {/* Quiz Route */}
                <Route path="/quiz/:taskId" element={<QuizContainer />} />
                
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Module View Route */}
                <Route path="/modules/:moduleId" element={
                  <DashboardLayout>
                    <DndProvider backend={HTML5Backend}>
                      <ModuleViewAlternative />
                    </DndProvider>
                  </DashboardLayout>
                } />


                {/* Protected Routes (With Sidebar) */}
                <Route
                  path="/worker/*"
                  element={
                    <DashboardLayout>
                      <SessionManager />
                        <Routes>
                          <Route path="home" element={<WorkerDashboard />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="support" element={<Messaging />} />
                          <Route path="courses" element={<Courses/>} />
                          
                          {/* to be deleted */}
                          <Route path="all-courses" element={<CoursesList/>} />
                        </Routes>
                    </DashboardLayout>
                  } />

                {/* SuperAdmin Routes */}
                <Route
                    path="/superadmin/*"
                      element={
                        <ProtectedSuperAdminRoute>
                          <DashboardLayout>
                            <Routes>
                                <Route path="home" element={<AdminDashboard />} />
                              <Route path="settings" element={<Settings />} />
                              <Route path="support" element={<Support />} />
                              <Route path="courses" element={<Courses />} />
                              <Route path="service-users" element={<ServiceUsersPage />} />
                              <Route path="set-questionnaire" element={<QuestionnaireAdmin />} />

                              {/* to be deleted */}
                              <Route path="all-courses" element={<CoursesList role="admin" />} />
                              <Route path="all-courses/create-and-manage-module" element={<AddModule />} />
                              
                              <Route path="superadmin-settings" element={<SuperAdminSettings />} />
                            </Routes>
                          </DashboardLayout>
                        </ProtectedSuperAdminRoute>
                      }
                  />
                <Route
                
                  path="/admin/*"
                  element={
                    <DashboardLayout>
                      <SessionManager />
                      <Routes>
                        <Route path="home" element={<AdminDashboard />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="support" element={<Messaging />} />
                        <Route path="courses" element={<Courses />} />
                        <Route path="service-users" element={<ServiceUsersPage />} />
                      <Route path="set-questionnaire" element={<QuestionnaireAdmin />} />

                        {/* to be deleted */}
                        <Route path="all-courses" element={<CoursesList role="admin" />} />
                        <Route path="all-courses/create-and-manage-module" element={<AddModule />} />
                    </Routes>
                  </DashboardLayout>
                } />
              </Routes>
              <LocationWrapper />
            </Router>
          </EnrollmentContextProvider>
        </PreviewModeProvider>
      </SuperAdminContextProvider>
    </AuthContextProvider>
  );
}

export default App;