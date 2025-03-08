import React, { useState, forwardRef, useImperativeHandle } from 'react';
import '../../styles/VisualQuestionAndAnswerFormEditor.css';

const VisualQuestionAndAnswerFormEditor = forwardRef((props, ref) => {
  const [questionData, setQuestionData] = useState({
    question: '',
    answer: ''
  });
  const [submittedData, setSubmittedData] = useState([]);

  // Expose component's data to parent via ref
  useImperativeHandle(ref, () => ({
    getSubmittedData: () => submittedData
  }));

  const handleQuestionChange = (event) => {
    const { name, value } = event.target;
    setQuestionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedData([...submittedData, {...questionData, id: Date.now()}]); // Add a unique ID for key and delete reference
    setQuestionData({ question: '', answer: '' }); // Reset form after submission
  };

  const handleRemoveEntry = (id) => {
    setSubmittedData(submittedData.filter(entry => entry.id !== id));
  };

  return (
    <div ref={ref} className="visual-question-and-answer-form-editor">
      <form onSubmit={handleSubmit} className="qa-entry">
        <div className="form-group">
          <label className="label">Question</label>
          <input
            name="question"
            value={questionData.question}
            onChange={handleQuestionChange}
            placeholder="Enter your question"
            required
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label className="label">Answer</label>
          <input
            name="answer"
            value={questionData.answer}
            onChange={handleQuestionChange}
            placeholder="Enter your answer"
            required
            className="input-field"
          />
        </div>
        <button type="submit" className="button submit-button">Submit</button>
      </form>
      {submittedData.map((data, index) => (
        <div key={index} className="qa-entry">
          <div className="question-answer-container">
            Question: {data.question}
          </div>
          <div className="question-answer-container">
            Answer: {data.answer}
          </div>
          <button onClick={() => handleRemoveEntry(data.id)} className="button delete-button">Delete</button>
        </div>
      ))}
    </div>
  );
});

export default VisualQuestionAndAnswerFormEditor;

















