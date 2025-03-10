import { Link } from "react-router-dom";
import "../styles/AdminDashboard.css";

const metricsData = {
  totalUsers: 1248,
  activeUsers: 986,
  totalModules: 76,
};

const attentionItems = {
  reportedIssues: 5,
  pendingApprovals: 3,
};

function AdminDashboard() {
  return (
    <div className="dashboard-container">
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

      <Link to="/admin/support" className="attention-section">
          <h3 className="attention-section-title">Requires Attention</h3>
          <div className="flex">
            <div className="attention-item">
              <h3 className="attention-title">Reported Issues</h3>
              <p className="attention-value">{attentionItems.reportedIssues}</p>
            </div>
            <div className="attention-item warning">
              <h3 className="attention-title">Pending Approvals</h3>
              <p className="attention-value warning">{attentionItems.pendingApprovals}</p>
            </div>
          </div>
      </Link>
    </div>
  );
}

export default AdminDashboard;
