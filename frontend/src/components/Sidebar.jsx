import React from "react";
import { FaHome, FaUserGraduate, FaUser, FaEnvelope, FaCog, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Sidebar.css"; // Custom CSS file

const Sidebar = ({role}) => {
    
    const basePath = role === "admin" ? "/admin" : "/worker";
    return (
        <div className="sidebar">
        <div className="logo">🧠</div>
        <div className="menu">
            <Link to={`${basePath}/home`}><FaHome className="icon" /></Link> {/* Home link */}
            <Link to={`${basePath}/courses`}><FaUserGraduate className="icon" /></Link>
            <Link to={`${basePath}/profile`}><FaUser className="icon" /></Link>
            <Link to={`${basePath}/messages`}><FaEnvelope className="icon" /></Link>
            <Link to={`${basePath}/settings`}><FaCog className="icon" /></Link>
        </div>

        <Link to="/logout" className="logout">
            <FaSignOutAlt className="logout-icon" />
        </Link>
        </div>
    );
};

export default Sidebar;
