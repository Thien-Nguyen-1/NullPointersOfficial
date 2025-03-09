import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Module completion screen shown when a user completes all content in a module
 * Module completion congratulations screen

 * 
 * @param {Object} user - The current user object
 */
const ModuleCompletion = ({ user }) => {
  const navigate = useNavigate();
  
  // Get the user role from the user prop
  const role = user?.user_type || 'worker'; // Default to 'worker' if role is undefined
  // Create the correct path based on role
  const coursesPath = role === 'admin' ? '/admin/all-courses' : '/worker/all-courses';
  
  return (
    <div className="alt-module-completion">
      <div className="congratulations-icon">🎉</div>
      <h2>Congratulations!</h2>
      <p>You have successfully completed all content in this module.</p>
      <p className="completion-message">
        Your progress has been saved. You can now continue to explore other modules.
      </p>
      <div className="completion-actions">
        <button 
          className="back-to-modules-button"
          onClick={() => navigate(coursesPath)}
        >
          Back to Modules
        </button>
      </div>
    </div>
  );
};

export default ModuleCompletion;