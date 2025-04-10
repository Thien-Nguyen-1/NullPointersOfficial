import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import api, { fetchServiceUsers, fetchAdminUsers } from "../services/api";
import "../styles/AdminDashboard.css";
import CreateTagModal from "../components/CreateTagModal";
import AlertComponent from "../components/AlertComponent";

// Icons
import { FaUserFriends, FaUserShield, FaBook, FaTags, FaEnvelope } from "react-icons/fa";
import {
  MdCreateNewFolder,
  MdTag,
  MdSupervisorAccount,
  MdOutlineMessage,
  MdSettings,
  MdOutlineQuiz
} from "react-icons/md";

// Custom counter component for animated metrics
const AnimatedCounter = ({ value = 0, label, icon: Icon }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;

    // Calculate step and duration based on value size
    const duration = 1200; // ms
    const steps = 20;
    const stepTime = duration / steps;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="metric-card">
      <div className="metric-icon">
        <Icon />
      </div>
      <div className="metric-value">{count}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
};

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState({
    users: 0,
    admins: 0,
    courses: 0,
    tags: 0,
    unreadChats: 0
  });
  const [loading, setLoading] = useState(true);
  const [showTagModal, setShowTagModal] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        // Fetch service users
        const serviceUsers = await fetchServiceUsers();
        const users = serviceUsers.length || 0;

        // Fetch admin users (superadmins + verified admins)
        const adminUsers = await fetchAdminUsers();
        const admins = adminUsers.length || 0;

        // Fetch all modules/courses
        const coursesResponse = await api.get('/api/modules/');
        const courses = coursesResponse.data.length || 0;

        // Fetch all tags
        const tagsResponse = await api.get('/api/tags/');
        const tags = tagsResponse.data.length || 0;

        // Fetch conversations (support chats)
        const chatsResponse = await api.get('/api/support/chat-details/');
        // Unread chats are ones where hasEngaged is false
        const unreadChats = chatsResponse.data ?
          chatsResponse.data.filter(chat => !chat.hasEngaged).length : 0;

        console.log("Fetched metrics:", { users, admins, courses, tags, unreadChats });

        // Update metrics
        setMetrics({
          users,
          admins,
          courses,
          tags,
          unreadChats
        });
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        // Set fallback values if API fails
        setMetrics({
          users: 0,
          admins: 0,
          courses: 0,
          tags: 0,
          unreadChats: 0
        });

        // Try individual fetches to get whatever data we can
        try {
          api.get('/api/modules/')
            .then(res => setMetrics(prev => ({ ...prev, courses: res.data.length || 0 })))
            .catch(e => console.error("Could not fetch modules:", e));

          api.get('/api/tags/')
            .then(res => setMetrics(prev => ({ ...prev, tags: res.data.length || 0 })))
            .catch(e => console.error("Could not fetch tags:", e));

          api.get('/service-users/')
            .then(res => setMetrics(prev => ({ ...prev, users: res.data.length || 0 })))
            .catch(e => console.error("Could not fetch users:", e));

          api.get('/api/support/chat-details/')
            .then(res => {
              if (res.data) {
                const unreadCount = res.data.filter(chat => !chat.hasEngaged).length;
                setMetrics(prev => ({ ...prev, unreadChats: unreadCount }));
              }
            })
            .catch(e => console.error("Could not fetch chats:", e));
        } catch (innerError) {
          console.error("Error during individual fetches:", innerError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  const metricCards = [
    { value: metrics.users, label: "Registered Users", icon: FaUserFriends },
    { value: metrics.admins, label: "Admins", icon: FaUserShield },
    { value: metrics.courses, label: "Courses", icon: FaBook },
    { value: metrics.tags, label: "Tags", icon: FaTags },
    { value: metrics.unreadChats, label: "Unread Chats", icon: FaEnvelope }
  ];

  // Check if user is superadmin
  const isSuperAdmin = user && user.user_type === 'superadmin';

  // Handler for tag creation success
  const handleTagCreated = (newTag) => {
    // Update tag count in metrics
    setMetrics(prev => ({
      ...prev,
      tags: prev.tags + 1
    }));

    // Show success alert
    setAlert({
      show: true,
      message: `Tag "${newTag.tag}" created successfully!`,
      type: 'success'
    });
  };

  // Handle action card click
  const handleActionCardClick = (action, e) => {
    if (action === 'createTag') {
      e.preventDefault(); // Prevent navigation
      setShowTagModal(true);
    }
  };

  // Common action cards for both admin and superadmin
  const commonActionCards = [
    {
      title: "View Modules",
      description: "Browse all available learning modules",
      icon: <FaBook />,
      link: "/admin/all-courses",
      color: "#1976D2", // Blue
      action: null
    },
    {
      title: "Create Module",
      description: "Create and manage learning modules",
      icon: <MdCreateNewFolder />,
      link: "/admin/all-courses/create-and-manage-module",
      color: "#2E7D32", // Site green
      action: null
    },
    {
      title: "Create Tag",
      description: "Organize content with custom tags",
      icon: <MdTag />,
      link: "#", // We'll prevent navigation and show modal instead
      color: "#FFC107", // Yellow
      action: "createTag"
    },
    {
      title: "Manage Users",
      description: "View and manage service users",
      icon: <MdSupervisorAccount />,
      link: "/admin/service-users",
      color: "#673AB7", // Purple
      action: null
    },
    {
      title: "Support",
      description: "Handle support messages",
      icon: <MdOutlineMessage />,
      link: "/admin/support",
      color: "#D32F2F", // Red
      action: null
    },
    {
      title: "Settings",
      description: "Configure your account",
      icon: <MdSettings />,
      link: "/admin/settings",
      color: "#00838F", // Teal
      action: null
    }
  ];

  // Superadmin specific action cards
  const superAdminActionCards = [
    {
      title: "Create Admin",
      description: "Add new administrator accounts",
      icon: <FaUserShield />,
      link: "/superadmin/superadmin-settings",
      color: "#FF9800" // Orange
    },
    {
      title: "Questionnaire",
      description: "Manage assessment questionnaire",
      icon: <MdOutlineQuiz />,
      link: "/superadmin/set-questionnaire",
      color: "#E91E63" // Pink
    },
    {
      title: "Update Terms",
      description: "Modify terms and conditions",
      icon: <MdCreateNewFolder />,
      link: "/superadmin/superadmin-settings",
      color: "#FF5722" // Coral/pinky orange
    }
  ];

  // For superadmins, replace some cards with their specific ones
  const actionCards = isSuperAdmin
    ? [
        commonActionCards[0], // View Modules
        commonActionCards[1], // Create Module
        commonActionCards[2], // Create Tag
        superAdminActionCards[0], // Create Admin
        superAdminActionCards[1], // Questionnaire
        superAdminActionCards[2], // Update Terms
        commonActionCards[3], // Manage Users
        commonActionCards[4], // Support
        commonActionCards[5]  // Settings
      ]
    : commonActionCards;

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {/* Animated Metrics Row */}
      <div className="metrics-container">
        {loading ? (
          <div className="loading-metrics">Loading dashboard metrics...</div>
        ) : (
          metricCards.map((metric, index) => (
            <AnimatedCounter
              key={index}
              value={metric.value}
              label={metric.label}
              icon={metric.icon}
            />
          ))
        )}
      </div>

      {/* Bento Box Action Cards */}
      <div className={`action-cards-grid ${isSuperAdmin ? 'superadmin-grid' : 'admin-grid'}`}>
        {actionCards.slice(0, 6).map((card, index) => (
          <Link
            to={card.link}
            className="action-card"
            key={index}
            style={{ "--card-color": card.color }}
            onClick={card.action ? (e) => handleActionCardClick(card.action, e) : undefined}
          >
            <div className="action-card-icon">
              {card.icon}
            </div>
            <div className="action-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Additional cards for superadmin */}
      {isSuperAdmin && actionCards.length > 6 && (
        <div className="additional-cards-grid">
          {actionCards.slice(6).map((card, index) => (
            <Link
              to={card.link}
              className="action-card"
              key={index + 6}
              style={{ "--card-color": card.color }}
              onClick={card.action ? (e) => handleActionCardClick(card.action, e) : undefined}
            >
              <div className="action-card-icon">
                {card.icon}
              </div>
              <div className="action-card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        onSuccess={handleTagCreated}
      />

      {/* Alert component */}
      {alert.show && (
        <AlertComponent
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}
    </div>
  );
}

export default AdminDashboard;