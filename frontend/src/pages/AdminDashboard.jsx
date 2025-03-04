import { Link } from "react-router-dom";


function AdminDashboard() {
  return (
    <div className="dashboard-container">
        <h1 className="page-title">Admin Dashboard</h1>

        {/* Admin-specific features */}
        <div className="admin-features-grid">
          <Link to="/admin/create-module" className="feature-card">
            <h3>Create Module</h3>
            <p>Design and manage learning modules.</p>
          </Link>

          <Link to="/admin/create-tag" className="feature-card">
            <h3>Create Tag</h3>
            <p>Organize content with tags.</p>
          </Link>

          <Link to="/admin/patient-profiles" className="feature-card">
            <h3>Patient Profiles</h3>
            <p>Manage patient data and records.</p>
          </Link>

          <Link to="/admin/medical-professionals" className="feature-card">
            <h3>Medical Professionals</h3>
            <p>Oversee healthcare professionals.</p>
          </Link>

          <Link to="/admin/settings" className="feature-card">
            <h3>Settings</h3>
            <p>Go to settings.</p>
          </Link>
        </div>

    </div>
  );
}

export default AdminDashboard;
