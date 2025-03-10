import { Link } from "react-router-dom";
import "../styles/AdminDashboard.css";

// Expanded data objects
const metricsData = {
  totalUsers: 1248,
  activeUsers: 986,
  totalModules: 76,
};

const attentionItems = {
  reportedIssues: 5,
  pendingApprovals: 3,
};

const recentActivity = {
  newModules: [
    { id: 1, title: "Introduction to Patient Care", tags: ["Healthcare", "Basics"], date: "Feb 26, 2025" },
    { id: 2, title: "Advanced Clinical Procedures", tags: ["Healthcare", "Advanced"], date: "Feb 24, 2025" },
    { id: 3, title: "Medical Ethics Workshop", tags: ["Ethics", "Healthcare"], date: "Feb 23, 2025" }
  ],
  newUsers: [
    { id: 101, firstName: "Sarah", lastName: "Johnson", username: "sjohnson", date: "Feb 27, 2025" },
    { id: 102, firstName: "Michael", lastName: "Chen", username: "mchen", date: "Feb 26, 2025" }
  ]
};

function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <h1 className="page-title">Admin Dashboard</h1>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-title">Total Users</div>
          <div className="metric-value">{metricsData.totalUsers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Active Users</div>
          <div className="metric-value">{metricsData.activeUsers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Modules</div>
          <div className="metric-value">{metricsData.totalModules}</div>
        </div>
      </div>

      <div className="admin-features-grid">
        <Link to="/admin/create-module" className="feature-card">
          <h3>Create Module</h3>
          <p>Design and manage learning modules.</p>
        </Link>
        <Link to="/admin/create-tag" className="feature-card">
          <h3>Create Tag</h3>
          <p>Organize content with tags.</p>
        </Link>
        <Link to="/admin/users" className="feature-card">
          <h3>Patient Profiles</h3>
          <p>Manage patient data and records.</p>
        </Link>
      </div>

      <div className="attention-section">
        <h2>Requires Attention</h2>
        <div className="attention-item">
          <h3 className="attention-title">Reported Issues</h3>
          <p className="attention-value">{attentionItems.reportedIssues}</p>
        </div>
        <div className="attention-item warning">
          <h3 className="attention-title">Pending Approvals</h3>
          <p className="attention-value warning">{attentionItems.pendingApprovals}</p>
        </div>
      </div>

      <div className="recent-activity-section">
        <h2>Recent Activity</h2>
        <h3>New Modules</h3>
        <ul>
          {recentActivity.newModules.map(module => (
            <li key={module.id} className="recent-item">
              <span className="recent-item-title">{module.title}</span>
              <span className="recent-item-date">{module.date}</span>
              <div>
                {module.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="analytics-section">
        <h2>Analytics Overview</h2>
        <p>Charts and stats will go here...</p>
      </div>
    </div>
  );
}

export default AdminDashboard;
