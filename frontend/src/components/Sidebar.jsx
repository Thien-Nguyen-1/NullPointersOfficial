import React from "react";
import { FaHome, FaUserGraduate, FaUser, FaEnvelope, FaCog, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Sidebar.css"; // Custom CSS file

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">🧠</div>
      <div className="menu">
        <Link to="/home"><FaHome className="icon" /> </Link> {/* Home link */}
        <Link to="/courses"><FaUserGraduate className="icon" /></Link>
        <Link to="/profile"><FaUser className="icon" /></Link>
        <Link to="/messages"><FaEnvelope className="icon" /></Link>
        <Link to="/settings"><FaCog className="icon" /></Link>
      </div>

      <Link to="/logout" className="logout">
        <FaSignOutAlt className="logout-icon" />
      </Link>
    </div>
  );
};

export default Sidebar;
