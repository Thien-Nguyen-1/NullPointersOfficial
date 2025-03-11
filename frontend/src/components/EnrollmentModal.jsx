// Popup Screen to Enrol User Into Module

import React from "react";
import "../styles/EnrollmentModal.css"; 

function EnrollmentModal({ isOpen, onClose, module, onEnroll }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {

    // Only close if the click was directly on the overlay, not its children
    if (e.target.className === 'enrollment-modal-overlay') {
        onClose();
    }
  }

  return (
    <div className="enrollment-modal-overlay"
        onClick={handleOverlayClick}
    >
      <div className="enrollment-modal">
        <div className="enrollment-modal-header">
          <h2>Enrol in Course</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="enrollment-modal-content">
          <h3>{module?.title}</h3>
          <p className="module-description">{module?.description || "No description available."}</p>
          
          {/* Will add more module details here if needed LOL */}
          
          <div className="enrollment-modal-actions">
            <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="enroll-btn" onClick={() => onEnroll(module.id)}>
              Enrol Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnrollmentModal;