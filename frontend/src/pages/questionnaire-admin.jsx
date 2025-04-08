// QuestionnaireAdmin.jsx
import React, { useState, useEffect } from 'react';
import '../styles/QuestionnaireAdmin.css';
import {SubmitQuestionnaire} from '../services/api';

const QuestionnaireAdmin = () => {
  // Sample data - this would be fetched from your Django backend
  const [questions, setQuestions] = useState([
    { 
      id: 1, 
      question: "Are you ready to return to work?", 
      yes_next_q: 2, 
      no_next_q: 3,
      assessment_tag: null
    },
    { 
      id: 2, 
      question: "Do you still want more support?", 
      yes_next_q: 4, 
      no_next_q: 5,
      assessment_tag: null
    },
    { 
      id: 3, 
      question: "Do you have anxiety?", 
      yes_next_q: 6, 
      no_next_q: null,
      assessment_tag: null
    },
    { 
      id: 4, 
      question: "Would you like to talk to HR?", 
      yes_next_q: null, 
      no_next_q: null,
      assessment_tag: "HR Intervention"
    },
    { 
      id: 5, 
      question: "Would you like to update your manager?", 
      yes_next_q: null, 
      no_next_q: null,
      assessment_tag: "Work Readiness"
    },
    { 
      id: 6, 
      question: "Have you considered counseling?", 
      yes_next_q: null, 
      no_next_q: null,
      assessment_tag: "Social Anxiety"
    },
    { 
      id: 7, 
      question: "Would you like to discuss accommodations?", 
      yes_next_q: null, 
      no_next_q: null,
      assessment_tag: "Additional Support"
    },
  ]);
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Find the root question (the one that isn't referenced by any other question)
  const rootQuestion = questions.find(q => !questions.some(otherQ => 
    otherQ.yes_next_q === q.id || otherQ.no_next_q === q.id
  ));
  
  // Get a question by ID
  const getQuestionById = (id) => {
    return questions.find(q => q.id === id) || null;
  };
  
  // Create a new question
  const addNewQuestion = () => {
    const newId = Math.max(...questions.map(q => q.id)) + 1;
    const newQuestion = { 
      id: newId, 
      question: "New Question", 
      yes_next_q: null, 
      no_next_q: null,
      assessment_tag: null
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newId);
  };
  
  // Update a question
  const updateQuestion = (id, updates) => {
    setQuestions(questions.map(q => q.id === id ? {...q, ...updates} : q));
  };

  // Save all changes to backend
  const saveAllChanges = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with your actual API
      //await api.post('/api/questionnaire/', questions);
      console.log("Saving questions:", questions);

      await SubmitQuestionnaire(questions);

    
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoading(false);
      // Show success message or notification
      alert("Changes saved successfully");
    } catch (err) {
      console.error("Error saving questions:", err);
      setError("Failed to save changes. Please try again.");
      setLoading(false);
    }
  };

  // Preview the questionnaire
  const previewQuestionnaire = () => {
    // Open preview in new tab or modal
    alert("Preview functionality would open a view of how the questionnaire looks to users");
  };
  
  // Question Node component
  const QuestionNode = ({ questionId, path = "" }) => {
    if (!questionId) return (
      <div className="question-end-node">
        End of questionnaire
      </div>
    );
    
    const question = getQuestionById(questionId);
    if (!question) return null;
    
    const isSelected = selectedQuestion === question.id;
    const isLeaf = !question.yes_next_q && !question.no_next_q;
    
    // Get tag class based on tag name
    const getTagClass = (tag) => {
      const tagClasses = {
        "HR Intervention": "tag-hr",
        "Work Readiness": "tag-work",
        "Social Anxiety": "tag-anxiety",
        "Additional Support": "tag-support"
      };
      
      return tagClasses[tag] || "tag-default";
    };
    
    return (
      <div className="question-node-container">
        <div 
          className={`question-node ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedQuestion(question.id)}
        >
          <div className="question-text">{question.question}</div>
          {path && <div className="question-path">{path}</div>}
          
          {/* Show assessment tag for leaf nodes */}
          {isLeaf && question.assessment_tag && (
            <div className="assessment-tag-container">
              <div className={`assessment-tag ${getTagClass(question.assessment_tag)}`}>
                {question.assessment_tag}
              </div>
            </div>
          )}
        </div>
        
        {(question.yes_next_q || question.no_next_q) && (
          <div className="question-branches">
            {question.yes_next_q && (
              <div className="branch-container yes-branch">
                <div className="branch-line-vertical"></div>
                <div className="branch-line-horizontal"></div>
                <div className="branch-label yes-label">Yes</div>
                <QuestionNode 
                  questionId={question.yes_next_q} 
                  path={path ? `${path} → Yes` : "Yes"}
                />
              </div>
            )}
            
            {question.no_next_q && (
              <div className="branch-container no-branch">
                <div className="branch-line-vertical"></div>
                <div className="branch-line-horizontal"></div>
                <div className="branch-label no-label">No</div>
                <QuestionNode 
                  questionId={question.no_next_q} 
                  path={path ? `${path} → No` : "No"}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Question Editor Component
  const QuestionEditor = () => {
    if (!selectedQuestion) return (
      <div className="editor-panel">
        <h3 className="editor-title">Questionnaire Editor</h3>
        <div className="editor-help">
          <p>
            Select any question in the tree to edit it.
          </p>
          <p>
            For end-of-path questions, you can assign an assessment tag.
          </p>
          <div className="editor-info">
            <span className="info-icon">i</span>
            <span>Assessment tags appear on leaf nodes (questions without any next questions).</span>
          </div>
        </div>
      </div>
    );
    
    const question = getQuestionById(selectedQuestion);
    const isLeaf = !question.yes_next_q && !question.no_next_q;
    
    const handleQuestionChange = (e) => {
      updateQuestion(selectedQuestion, { question: e.target.value });
    };
    
    const handleYesNextChange = (e) => {
      const nextId = e.target.value ? parseInt(e.target.value, 10) : null;
      updateQuestion(selectedQuestion, { yes_next_q: nextId });
    };
    
    const handleNoNextChange = (e) => {
      const nextId = e.target.value ? parseInt(e.target.value, 10) : null;
      updateQuestion(selectedQuestion, { no_next_q: nextId });
    };
    
    const handleAssessmentTagChange = (e) => {
      updateQuestion(selectedQuestion, { assessment_tag: e.target.value || null });
    };
    
    const assessmentTags = [
      "HR Intervention",
      "Work Readiness",
      "Social Anxiety",
      "Additional Support"
    ];
    
    return (
      <div className="editor-panel">
        <h3 className="editor-title">Edit Question</h3>
        
        <div className="editor-form">
          <div className="form-group">
            <label className="form-label">Question Text:</label>
            <input 
              type="text" 
              value={question.question} 
              onChange={handleQuestionChange}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">If Yes, go to:</label>
            <div className="select-container">
              <select 
                value={question.yes_next_q || ''} 
                onChange={handleYesNextChange}
                className="form-select yes-select"
              >
                <option value="">End of questionnaire</option>
                {questions
                  .filter(q => q.id !== selectedQuestion)
                  .map(q => (
                    <option key={q.id} value={q.id}>
                      {q.question}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">If No, go to:</label>
            <div className="select-container">
              <select 
                value={question.no_next_q || ''} 
                onChange={handleNoNextChange}
                className="form-select no-select"
              >
                <option value="">End of questionnaire</option>
                {questions
                  .filter(q => q.id !== selectedQuestion)
                  .map(q => (
                    <option key={q.id} value={q.id}>
                      {q.question}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          
          {/* Assessment tag selector - only shown for leaf nodes */}
          {isLeaf && (
            <div className="form-group">
              <label className="form-label">Assessment Tag:</label>
              <div className="select-container">
                <select 
                  value={question.assessment_tag || ''} 
                  onChange={handleAssessmentTagChange}
                  className="form-select tag-select"
                >
                  <option value="">No assessment tag</option>
                  {assessmentTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="save-button">Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="questionnaire-flow-content">
      <div className="page-header">
        <h2 className="page-title">Questionnaire Flow</h2>
        <div className="page-actions">
          <button 
            className="preview-button"
            onClick={previewQuestionnaire}
            disabled={loading}
          >
            Preview
          </button>
          <button 
            className="save-all-button"
            onClick={saveAllChanges}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save All Changes"}
          </button>
          <button 
            className="add-question-button"
            onClick={addNewQuestion}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H4a1 1 0 110-2h3V4a1 1 0 011-1z"/>
            </svg>
            Add New Question
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}
      
      <div className="content-container">
        {/* Tree visualization */}
        <div className="tree-container">
          <div className="tree-content">
            {rootQuestion && <QuestionNode questionId={rootQuestion.id} />}
          </div>
        </div>
        
        {/* Editor sidebar */}
        <div className="sidebar-container">
          <QuestionEditor />
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireAdmin;