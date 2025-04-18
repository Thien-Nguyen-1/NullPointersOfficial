// Popup Screen to Enrol User Into Module

import React from "react";
import "../styles/EnrollmentModal.css"; 

function EnrollmentModal({ isOpen, onClose, module, onEnroll, isEnrolled }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {

    // Only close if the click was directly on the overlay, not its children
    if (e.target.classList.contains('enrollment-modal-overlay')) {
        onClose();
    }
  }

  return (
    <div className="enrollment-modal-overlay"
        onClick={handleOverlayClick}
        role="dialog"
    >
      <div className="enrollment-modal">
        <div className="enrollment-modal-header">
          {/* to cater more to user who havent enrolled */}
          <h2>{isEnrolled ? "Module Information" : "Enrol in Course"}</h2> 
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="enrollment-modal-content">
          <h3>{module?.title}</h3>
          <p className="module-description">{module?.description || "No description available."}</p>
          
          {/* Will add more module details here if needed LOL */}
          {isEnrolled && (
            <div className="enrollment-status">
              <p className="already-enrolled-message">
                You are already enrolled in this module.
              </p>
            </div>
          )}

          
          <div className="enrollment-modal-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="enroll-btn" onClick={() => onEnroll(module.id)}>
              {isEnrolled ? "Continue Learning" : "Enrol Me"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnrollmentModal;