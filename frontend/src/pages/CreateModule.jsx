import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/MainQuizContainer.css";

const CreateModule = () => {
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [tags, setTags] = useState('');
  const [quizType, setQuizType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [apiEndpoints, setApiEndpoints] = useState([]);
  const navigate = useNavigate();

  // Check API connectivity on component mount
  useEffect(() => {
    const checkApiEndpoints = async () => {
      try {
        // Test if we can access the Django API at all
        const response = await axios.get('/api/modules/');
        console.log('API modules endpoint accessible:', response.status);
        setApiEndpoints(prev => [...prev, { url: '/api/modules/', status: response.status }]);
      } catch (err) {
        console.error('Error accessing API modules endpoint:', err);
        setApiEndpoints(prev => [...prev, { 
          url: '/api/modules/', 
          status: err.response?.status || 'Error', 
          error: err.message 
        }]);
      }
    };

    checkApiEndpoints();
  }, []);

  const handleCreateModule = async (e) => {
    e.preventDefault();
    
    if (!moduleTitle || !moduleDescription || !quizType) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log("Creating module with data:", {
        title: moduleTitle,
        description: moduleDescription,
      });
      
      // First create the module
      const moduleResponse = await axios.post('/api/modules/', {
        title: moduleTitle,
        description: moduleDescription,
      });
      
      console.log("Module creation response:", moduleResponse);
      
      const moduleId = moduleResponse.data.id;
      console.log("Module created with ID:", moduleId);
      
      // HARD CODED FOR AUTHOR (DELETE THIS LATER)
      const adminUserId = 1; 
      
      // Then create the task/quiz associated with this module
      console.log("Creating task with data:", {
        title: `${moduleTitle} Quiz`,
        description: `Interactive quiz for ${moduleTitle}`,
        moduleID: moduleId,
        quiz_type: quizType,
        text_content: `Quiz content for ${moduleTitle}`,
        is_published: false,
        author: adminUserId
      });
      
      const taskResponse = await axios.post('/api/tasks/', {
        title: `${moduleTitle} Quiz`,
        description: `Interactive quiz for ${moduleTitle}`,
        moduleID: moduleId,
        quiz_type: quizType,
        text_content: `Quiz content for ${moduleTitle}`,
        is_published: false,
        author: adminUserId
      });
      
      console.log("Task creation response:", taskResponse);
      
      // Navigate to the quiz editor
      navigate(`/admin/courses/create-module/${moduleId}/${quizType}`);
    } catch (error) {
      console.error('Error creating module:', error);
      
      let errorMessage = 'Failed to create module. ';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        errorMessage += `Server returned ${error.response.status}`;
        if (typeof error.response.data === 'string') {
          errorMessage += `: ${error.response.data.substring(0, 100)}...`;
        } else {
          errorMessage += `: ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage += 'No response received from server.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-module-container">
      <h1>Create New Module</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {apiEndpoints.length > 0 && (
        <div className="api-status-small">
          <details>
            <summary>API Status</summary>
            <ul>
              {apiEndpoints.map((endpoint, index) => (
                <li key={index}>
                  {endpoint.url}: {endpoint.status === 200 ? '✅ OK' : `❌ ${endpoint.status} ${endpoint.error || ''}`}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      
      <form onSubmit={handleCreateModule}>
        <div className="form-group">
          <label htmlFor="moduleTitle">Module Title <span className="required">*</span></label>
          <input
            type="text"
            id="moduleTitle"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="moduleDescription">Module Description <span className="required">*</span></label>
          <textarea
            id="moduleDescription"
            value={moduleDescription}
            onChange={(e) => setModuleDescription(e.target.value)}
            rows="4"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. anxiety, depression, self-care"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quizType">Quiz Type <span className="required">*</span></label>
          <select
            id="quizType"
            value={quizType}
            onChange={(e) => setQuizType(e.target.value)}
            required
          >
            <option value="">Select a quiz type</option>
            <option value="flashcard">Flashcard Quiz</option>
            <option value="statement_sequence">Statement Sequence Quiz</option>
            <option value="text_input">Fill in the Blank Quiz</option>
            <option value="question_answer_form">Question and Answer Form</option>
            <option value="matching_questions">Matching Questions</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Module'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateModule;