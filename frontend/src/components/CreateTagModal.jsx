import React, { useState } from 'react';
import api from '../services/api';
import '../styles/CreateTagModal.css';

const CreateTagModal = ({ isOpen, onClose, onSuccess }) => {
  const [tagName, setTagName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!tagName.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      // Use your API to create a new tag
      const response = await api.post('/api/tags/', { tag: tagName.toLowerCase() });

      // Clear the form and close modal
      setTagName('');
      setIsSubmitting(false);

      // Notify parent component of success
      if (onSuccess) {
        onSuccess(response.data);
      }

      onClose();
    } catch (err) {
      setIsSubmitting(false);
      // Extract error message from the API response
      if (err.response && err.response.data) {
        if (err.response.data.tag) {
          // This handles the case when the API returns {"tag": ["A tag with this name already exists."]}
          setError(err.response.data.tag[0] || 'Failed to create tag');
        } else if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else {
          setError('Failed to create tag. Please try again.');
        }
      } else {
        setError('Failed to create tag. Please try again.');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content tag-modal">
        <form onSubmit={handleSubmit} className="simple-tag-form">
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Enter tag"
            disabled={isSubmitting}
            autoFocus
          />

          {error && <p className="error-message">{error}</p>}

          <div className="modal-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTagModal;