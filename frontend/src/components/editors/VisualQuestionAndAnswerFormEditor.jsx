import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../services/AuthContext';  // Adjust path as necessary
import '../../styles/VisualQuestionAndAnswerFormEditor.css';

const VisualQuestionAndAnswerFormEditor = () => {
  const { user } = useContext(AuthContext); // Accessing the current user from context
  const [modules, setModules] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [questionData, setQuestionData] = useState({
    question: '',
    answer: '',
    moduleID: '',
  });
  const [error, setError] = useState('');
  const qaEditorRef = useRef(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/modules/');
        setModules(response.data);
      } catch (error) {
        setError('Failed to fetch modules');
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, []);

  const handleQuestionChange = (event) => {
    const { name, value } = event.target;
    setQuestionData(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleChange = (event) => {
    const moduleIDInt = parseInt(event.target.value, 10);
    setSelectedModuleId(moduleIDInt);
    setQuestionData(prev => ({ ...prev, moduleID: moduleIDInt }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setError('User is not authenticated');
      return;
    }
    try {
      const completeData = {
        ...questionData,
        title: 'Question and Answer Form',
        description: 'A form for entering Q&A pairs.',
        is_published: true,
        author: user.id  // Using the current user's ID from context
      };
      const response = await axios.post('http://localhost:8000/api/question_answer_forms/', completeData);
      setEntries([...entries, response.data]);
      setQuestionData({ question: '', answer: '', moduleID: '' });
    } catch (error) {
      setError('Failed to create question and answer');
      console.error('Error creating question and answer:', error);
    }
  };

  const handleRemoveEntry = async (contentID) => {
    try {
      await axios.delete(`http://localhost:8000/api/question_answer_forms/${contentID}/`);
      const updatedEntries = entries.filter(entry => entry.contentID !== contentID);
      setEntries(updatedEntries);
    } catch (error) {
      setError(`Failed to delete question and answer: ${error.message}`);
      console.error('Error deleting question and answer:', error);
    }
  };

  return (
    <div ref={qaEditorRef}>
      {entries.map((entry, index) => (
        <div key={index} className="qa-entry">
          <div className="question-answer-container">Question: {entry.question}</div>
          <div className="question-answer-container">Answer: {entry.answer}</div>
          <button onClick={() => handleRemoveEntry(entry.contentID)}>Remove</button>
        </div>
      ))}
      <div className="qa-entry">
        <form onSubmit={handleSubmit}>
          <select onChange={handleModuleChange} value={questionData.moduleID || ''}>
            <option value="">Select a Module</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>{module.title}</option>
            ))}
          </select>
          <input name="question" value={questionData.question} onChange={handleQuestionChange} placeholder="Enter your question" required />
          <input name="answer" value={questionData.answer} onChange={handleQuestionChange} placeholder="Enter your answer" required />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default VisualQuestionAndAnswerFormEditor;
















