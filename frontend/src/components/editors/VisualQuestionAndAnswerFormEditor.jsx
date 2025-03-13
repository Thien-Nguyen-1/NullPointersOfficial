import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import '../../styles/VisualQuestionAndAnswerFormEditor.css';
import { QuizApiUtils } from "../../services/QuizApiUtils";

const VisualQuestionAndAnswerFormEditor = forwardRef((props, ref) => {
  const [questionData, setQuestionData] = useState({
    question_text: '',
    hint_text: '',
    order: 0
  });
  const [submittedData, setSubmittedData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Assuming `initialQuestions` prop is passed to this component with data as seen in your debug output
  useEffect(() => {
    if (props.initialQuestions && props.initialQuestions.length > 0) {
      // Format and load initial data from the `initialQuestions` prop
      const loadedQuestions = props.initialQuestions.map(q => ({
        ...q,
        id: q.id, 
        question_text: q.text, 
        hint_text: q.hint, 
        order: q.order 
      }));
      setSubmittedData(loadedQuestions);
    }
  }, [props.initialQuestions]);

  useImperativeHandle(ref, () => ({
    getQuestions: () => submittedData
  }));

  const handleQuestionChange = (event) => {
    const { name, value } = event.target;
    setQuestionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newQuestions = isEditing ? 
      submittedData.map(q => q.id === editId ? { ...q, ...questionData } : q) : 
      [...submittedData, { ...questionData, id: Date.now() }];
    setSubmittedData(newQuestions);
    setIsEditing(false);
    setQuestionData({ question_text: '', hint_text: '', order: newQuestions.length });
  };

  const handleEdit = (id) => {
    const question = submittedData.find(q => q.id === id);
    setQuestionData({
      question_text: question.question_text, 
      hint_text: question.hint_text, 
      order: question.order
    });
    setEditId(id);
    setIsEditing(true);
  };

  const handleRemoveEntry = async(id) => {
    //setSubmittedData(submittedData.filter(entry => entry.id !== id));
    try {
      // Call the deleteQuestion function to remove from backend
      const result = await QuizApiUtils.deleteQuestion(id);
      if (result) {
        // If successful, update the local state to remove the question
        setSubmittedData(submittedData.filter(entry => entry.id !== id));
      }
    } catch (error) {
      console.log('Failed to delete question from backend:', submittedData.id);

      console.error('Failed to delete question from backend:', error);
      // Optionally handle the error, e.g., show a notification to the user
    }
  };

  return (
    <div ref={ref} className="visual-question-and-answer-form-editor">
      <form onSubmit={handleSubmit} className="qa-entry">
        <div className="form-group">
          <label className="label">Question</label>
          <input
            name="question_text"
            value={questionData.question_text}
            onChange={handleQuestionChange}
            placeholder="Enter your question"
            required
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label className="label">Hint</label>
          <input
            name="hint_text"
            value={questionData.hint_text}
            onChange={handleQuestionChange}
            placeholder="Enter a hint (optional)"
            className="input-field"
          />
        </div>
        <button type="submit" className="button submit-button">{isEditing ? 'Update Question' : 'Add Question'}</button>
      </form>
      {submittedData.map((data, index) => (
        <div key={data.id} className="qa-entry">
          <div className="question-answer-container">
            <strong>Question:</strong> {data.question_text}
          </div>
          <div className="question-answer-container">
            <strong>Hint:</strong> {data.hint_text}
          </div>
          <div>
            <button onClick={() => handleEdit(data.id)} className="button">Edit</button>
            <button onClick={() => handleRemoveEntry(data.id)} className="button delete-button">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
});

export default VisualQuestionAndAnswerFormEditor;



















