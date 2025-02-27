import React from "react";
import { FaHome, FaUser, FaEnvelope, FaCog, FaSignOutAlt, FaBrain, FaBook } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import '../styles/Sidebar.css'; // Import the CSS file

const Sidebar = ({ role }) => {
  const location = useLocation();
  const basePath = role === "admin" ? "/admin" : "/worker";

  const menuItems = [
    { path: "home", icon: <FaHome size={24} />, label: "Home" },
    { path: "courses", icon: <FaBook size={24} />, label: "Courses" },
    { path: "profile", icon: <FaUser size={24} />, label: "Profile" },
    { path: "messages", icon: <FaEnvelope size={24} />, label: "Messages" },
    { path: "settings", icon: <FaCog size={24} />, label: "Settings" }
  ];

  const isActive = (path) => {
    return location.pathname === `${basePath}/${path}`;
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-circle">
          <FaBrain size={30} color="white" />
        </div>
      </div>

      <div className="menu">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path}
              to={`${basePath}/${item.path}`}
              className={`menu-item ${active ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon}
              {active && <div className="active-indicator"></div>}
            </Link>
          );
        })}
      </div>

      <Link to="/logout" className="logout">
        <FaSignOutAlt size={24} />
      </Link>
    </div>
  );
};

export default Sidebar;
