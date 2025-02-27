import React from "react";
import { FaHome, FaUser, FaEnvelope, FaCog, FaSignOutAlt, FaBrain, FaBook } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
// We'll use inline styles first to make sure styling works

const Sidebar = ({ role }) => {
  const location = useLocation();
  const basePath = role === "admin" ? "/admin" : "/worker";
  
  // Menu items configuration for easy maintenance
  const menuItems = [
    { path: "home", icon: <FaHome size={24} />, label: "Home" },
    { path: "courses", icon: <FaBook size={24} />, label: "Courses" },
    { path: "profile", icon: <FaUser size={24} />, label: "Profile" },
    { path: "messages", icon: <FaEnvelope size={24} />, label: "Messages" },
    { path: "settings", icon: <FaCog size={24} />, label: "Settings" }
  ];

  // Check if the current route is active
  const isActive = (path) => {
    return location.pathname === `${basePath}/${path}`;
  };

  // Inline styles to ensure visibility
  const sidebarStyle = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e9f0ea', // Light green background from the screenshot
    color: 'white',
    height: '100vh',
    width: '80px',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100
  };

  const logoStyle = {
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
    marginBottom: '20px',
    color: '#386a50' // Dark green for the logo
  };

  const menuStyle = {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    alignItems: 'center',
    padding: '10px 0'
  };

  const menuItemStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '15px 0',
    color: active ? '#386a50' : '#386a50', // Dark green color for icons
    textDecoration: 'none',
    marginBottom: '5px',
    position: 'relative',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  });

  const activeIndicatorStyle = {
    content: '',
    position: 'absolute',
    left: 0,
    height: '100%',
    width: '4px',
    backgroundColor: '#386a50' // Dark green for the active indicator
  };

  const logoutStyle = {
    marginTop: 'auto',
    marginBottom: '20px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    color: '#386a50', // Dark green for the logout icon
    textDecoration: 'none'
  };

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>
        <div style={{ 
          backgroundColor: '#386a50', 
          borderRadius: '50%', 
          width: '50px', 
          height: '50px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <FaBrain size={30} color="white" />
        </div>
      </div>

      <div style={menuStyle}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path}
              to={`${basePath}/${item.path}`}
              style={menuItemStyle(active)}
              title={item.label}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(56, 106, 80, 0.1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {item.icon}
              {active && <div style={activeIndicatorStyle}></div>}
            </Link>
          );
        })}
      </div>

      <Link 
        to="/logout" 
        style={logoutStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(56, 106, 80, 0.1)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FaSignOutAlt size={24} />
      </Link>
    </div>
  );
};

export default Sidebar;