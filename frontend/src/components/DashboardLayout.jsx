import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../App.css";

const DashboardLayout = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const userType = user.user_type;
      
      if (!userType) {
        navigate("/");
        return;
      }

      const sidebarRole = userType === "admin" ? "admin" : "worker";
      setUserRole(sidebarRole);
    } catch (error) {
      console.error("Error retrieving user data:", error);
      navigate("/");
    }
  }, [navigate]);
  
  if (!userRole) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="app-container">
      <Sidebar role={userRole} />
      <main className="main-content">{children}</main>
    </div>
  );
};

export default DashboardLayout;