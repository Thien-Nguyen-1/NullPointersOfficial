import React from "react";
import Sidebar from "./Sidebar"; // Sidebar for authenticated users
import "../App.css";

const DashboardLayout = ({ children }) => {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    );
};
  

export default DashboardLayout;
