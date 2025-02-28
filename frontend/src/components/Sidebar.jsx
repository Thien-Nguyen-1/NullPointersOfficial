import React from "react";
import { FaHome, FaUsers, FaCog, FaSignOutAlt, FaBrain} from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { PiBooksBold } from "react-icons/pi";
import { PiColumnsPlusLeftFill } from "react-icons/pi";

import { Link, useLocation, useNavigate } from "react-router-dom";
import '../styles/Sidebar.css'; 
import {logoutUser} from "../services/api";

const Sidebar = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = role === "admin" ? "/admin" : "/worker";

  const commonItems = [
    { path: "home", icon: <FaHome size={24} />, label: "Home" },
    { path: "courses", icon: <PiBooksBold size={24} />, label: "Courses" },
    { path: "support", icon: <BiSupport size={24} />, label: "Support" },
    { path: "settings", icon: <FaCog size={24} />, label: "Settings" },

  ];
  
  // Admin-specific menu items
  const adminItems = [
    { path: "users", icon: <FaUsers size={24} />, label: "Manage Users" },
    { path: "create-module", icon: <PiColumnsPlusLeftFill size={24} />, label: "Create Module" }

  ];
  
  // Worker-specific menu items (for "service user")
  const workerItems = [  ];

  const menuItems = [...commonItems];
  if (role === "admin") {
    menuItems.splice(1, 0, ...adminItems);
  } else {
    menuItems.splice(1, 0, ...workerItems);
  }

  const isActive = (path) => {
    return location.pathname === `${basePath}/${path}`;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      // The redirection should happen in the logoutUser function
      // But as a fallback:
      navigate('/login');
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to navigate even if there's an error
      navigate('/login');
    }
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
      <div className="logout" onClick={handleLogout} title="Logout">
        <FaSignOutAlt size={24} />
      </div>
    </div>
  );
};

export default Sidebar;
