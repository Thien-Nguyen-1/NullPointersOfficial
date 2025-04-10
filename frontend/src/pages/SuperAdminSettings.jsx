// Main SuperAdmin settings page

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../services/AuthContext';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import InlineRichTextEditor from '../components/superadmin-settings/RichTextEditor';
import '../styles/SuperAdminSettings.css';

const SuperAdminSettings = () => {
  const { token } = useContext(AuthContext);
  const { 
    termsAndConditions, 
    adminUsers, 
    isLoading, 
    error, 
    updateTermsAndConditions, 
    addAdminUser, 
    removeAdminUser,
    resendAdminVerification
  } = useSuperAdmin();
  
  // Terms and Conditions state
  const [termsContent, setTermsContent] = useState('');
  const [termsLastUpdated, setTermsLastUpdated] = useState(null);
  const [termsEditMode, setTermsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Admin Management state
  const [newAdmin, setNewAdmin] = useState({ 
    username: '', 
    first_name: '', 
    last_name: '', 
    email: '', 
    password: '', 
    confirm_password: '' 
  });
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [requireVerification, setRequireVerification] = useState(true);

  // JUST TO DEBUG
  useEffect(() => {
    console.log('adminUsers:', adminUsers);
  }, [adminUsers]);

  // Load terms and conditions data
  useEffect(() => {
    if (termsAndConditions) {
      setTermsContent(termsAndConditions);
      // In a real app, we should get this from the API response
      setTermsLastUpdated(new Date().toLocaleDateString());
    }
  }, [termsAndConditions]);

  // Handle Terms & Conditions actions
  const handleTermsEdit = () => {
    setTermsEditMode(true);
  };

  const handleTermsSave = async (content) => {
    try {
      // Make API call to update terms
      await updateTermsAndConditions(content);
      
      // Update local state
      setTermsContent(content);
      setTermsLastUpdated(new Date().toLocaleDateString());
      setTermsEditMode(false);
      setSuccessMessage('Terms and conditions updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update terms:', err);
    }
  };

  const handleTermsCancel = () => {
    setTermsContent(termsAndConditions);
    setTermsEditMode(false);
  };

  // Handle Admin Management actions
  const handleAddAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin({
      ...newAdmin,
      [name]: value
    });
    
    // Clear validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const validateAdminForm = () => {
    const errors = {};
    
    if (!newAdmin.username.trim()) errors.username = 'Username is required';
    if (!newAdmin.first_name.trim()) errors.first_name = 'First name is required';
    if (!newAdmin.last_name.trim()) errors.last_name = 'Last name is required';
    if (!newAdmin.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(newAdmin.email)) errors.email = 'Email is invalid';
    
    if (!newAdmin.password) errors.password = 'Password is required';
    else if (newAdmin.password.length < 8) errors.password = 'Password must be at least 8 characters';
    
    if (!newAdmin.confirm_password) errors.confirm_password = 'Please confirm password';
    else if (newAdmin.password !== newAdmin.confirm_password) errors.confirm_password = 'Passwords do not match';
    
    return errors;
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    // Validate the form
    const errors = validateAdminForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {

      // include the verification requirement
      const adminData = {
        ...newAdmin,
        require_verification: requireVerification
      };
      await addAdminUser(adminData);
      setNewAdmin({ 
        username: '', 
        first_name: '', 
        last_name: '', 
        email: '', 
        password: '', 
        confirm_password: '' 
      });
      setShowAddAdminForm(false);
      setSuccessMessage(`Admin user added successfully${requireVerification ? '. Verification email has been sent.' : ' and this user can log in immediately.'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to add admin:', err);
      setValidationErrors({ form: err.message || 'Failed to add admin user' });
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to remove this admin user?')) {
      try {
        await removeAdminUser(adminId);
        setSuccessMessage('Admin user removed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to remove admin:', err);
      }
    }
  };

  const handleResendVerification = async (adminId) => {
    try {
      await resendAdminVerification(adminId);
      setSuccessMessage('Verification email has been resent successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to resend verification:', err);
      alert('Failed to resend verification email: ' + (err.message || 'Unknown error'));
    }
  };


  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="super-admin-container">
      <h1 className="page-title">Super Admin Settings</h1>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {/* Terms & Conditions Section */}
      <section className="settings-section">
        <div className="section-header">
          <h2>Terms & Conditions</h2>
          {termsLastUpdated && (
            <span className="last-updated">Last updated: {termsLastUpdated}</span>
          )}
        </div>
        
        <div className="terms-container">
          {termsEditMode ? (
            <InlineRichTextEditor 
              initialContent={termsContent}
              onSave={handleTermsSave}
              onCancel={handleTermsCancel}
            />
          ) : (
            <>
              <div 
                className="terms-preview"
                data-placeholder="Enter terms and conditions..."
                dangerouslySetInnerHTML={{ __html: termsContent || 'No terms and conditions have been set.' }}
              />
              <button className="btn-primary" onClick={handleTermsEdit}>
                Edit Terms & Conditions
              </button>
            </>
          )}
        </div>
      </section>
      
      {/*=================== Admin Management Section ========================*/}
      <section className="settings-section">
        <div className="section-header">
          <h2>Admin Management</h2>
        </div>
        
        <div className="admin-container">
          {Array.isArray(adminUsers) && adminUsers.length > 0 ? (
            <div className="admin-list">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Created Date</th>
                    <th>Email Verified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((admin) => admin && admin.id ? (
                    // Admin Email verification
                    <tr key={admin.id}>
                    <td>{admin.username}</td>
                    <td>{admin.first_name} {admin.last_name}</td>
                    <td>{admin.email}</td>
                    <td>{new Date(admin.date_joined).toLocaleDateString()}</td>
                    <td>
                      <span className={`verification-status ${admin.is_verified ? 'verified' : 'not-verified'}`}>
                        {admin.is_verified ? '✓ Verified' : '✗ Not Verified'}
                      </span>
                    </td>
                    <td>
                        <div className="admin-actions">
                          <button className="admin-btn btn-delete" onClick={() => handleRemoveAdmin(admin.id)}>
                            Remove
                          </button>

                          {admin.is_verified === false && (
                            <button className="admin-btn btn-resend-verification" onClick={() => handleResendVerification(admin.id)}>
                              Resend Verification
                            </button>
                          )}

                        </div>
                    </td>
                  </tr>
                  ): null)} 
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data-message">
              No admin users found.
            </div>
          )}
          
          {showAddAdminForm ? (
            <div className="add-admin-form">
              <h3>Add New Admin</h3>
              {validationErrors.form && (
                <div className="error-message form-error">
                  {validationErrors.form}
                </div>
              )}
              <form onSubmit={handleAddAdmin}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={newAdmin.username}
                    onChange={handleAddAdminChange}
                  />
                  {validationErrors.username && (
                    <span className="field-error">{validationErrors.username}</span>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={newAdmin.first_name}
                      onChange={handleAddAdminChange}
                    />
                    {validationErrors.first_name && (
                      <span className="field-error">{validationErrors.first_name}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={newAdmin.last_name}
                      onChange={handleAddAdminChange}
                    />
                    {validationErrors.last_name && (
                      <span className="field-error">{validationErrors.last_name}</span>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newAdmin.email}
                    onChange={handleAddAdminChange}
                  />
                  {validationErrors.email && (
                    <span className="field-error">{validationErrors.email}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newAdmin.password}
                    onChange={handleAddAdminChange}
                  />
                  {validationErrors.password && (
                    <span className="field-error">{validationErrors.password}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={newAdmin.confirm_password}
                    onChange={handleAddAdminChange}
                  />
                  {validationErrors.confirm_password && (
                    <span className="field-error">{validationErrors.confirm_password}</span>
                  )}
                </div>

                <div className="form-group verification-toggle">
                  <div className="toggle-content">
                    <label className="verification-label" htmlFor="require_verification">
                      <strong>Require Email Verification</strong>
                    </label>
                    <div className="toggle-description">
                      When enabled, the admin will need to verify their email address before they can log in to the system.
                      A verification email will be sent automatically when creating the account.
                    </div>
                  </div>
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="require_verification"
                      name="require_verification"
                      checked={requireVerification}
                      onChange={() => setRequireVerification(!requireVerification)}
                    />
                  </div>
                </div>
                
                <div className="button-group">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddAdminForm(false);
                      setValidationErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" data-testid="submit-admin-form">
                    Add Admin
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => setShowAddAdminForm(true)}
            >
              Add New Admin
            </button>
          )}
        </div>
      </section>
      <div style={{ height: '60px' }}></div>
    </div>
  );
};

export default SuperAdminSettings;