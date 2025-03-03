import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";
import "../../styles/MainQuizContainer.css";

function VisualFlowChartQuiz({ moduleId, quizType, onUpdateQuestions }) {
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);

  // Update parent component when statements change
  useEffect(() => {
    if (onUpdateQuestions) {
      // Format statements as questions for API compatibility
      const formattedQuestions = statements.map((statement, index) => ({
        id: statement.id, // Temporary ID for UI
        question_text: statement.text || "",
        hint_text: statement.question || "", // We'll use hint_text to store the question
        order: index
      }));
      
      onUpdateQuestions(formattedQuestions);
    }
  }, [statements, onUpdateQuestions]);

  // Add a new statement
  const addStatement = () => {
    setStatements([
      ...statements, 
      { 
        id: Date.now(), 
        text: "", 
        question: "", 
        answer: "Sample Answer" 
      }
    ]);
  };

  // Update a statement
  const updateStatement = (id, field, value) => {
    setStatements(statements.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Delete a statement
  const deleteStatement = (id) => {
    setStatements(statements.filter(s => s.id !== id));
    setSelectedStatement(null);
  };

  // Save changes to a statement
  const saveChanges = () => {
    // Already saving changes automatically through state updates
    // This function is kept for UI consistency
    if (selectedStatement) {
      alert("Changes saved successfully!");
    }
  };

  return (
    <div className="visual-sequence-editor">
      <div className="sequence-flow">
        {statements.map((statement, index) => (
          <React.Fragment key={statement.id}>
            {index > 0 && (
              <div
                className={`sequence-arrow ${index % 2 === 0 ? "even-arrow" : "odd-arrow"}`}
              >
                &#x276D;&#x276D;&#x276D;
              </div>
            )}
            <div
              className={`sequence-item ${index % 2 === 0 ? "even-editor" : "odd-editor"} ${selectedStatement?.id === statement.id ? "selected" : ""}`}
              onClick={() => setSelectedStatement(statement)}
            >
              <p className="statement-content">{statement.text || "Click to edit this statement"}</p>
            </div>
          </React.Fragment>
        ))}
        <div className="add-statement-container" onClick={addStatement}>
          <button className="add-statement-button">
            <div className="plus-icon">+</div>
          </button>
          <p className="add-statement-text">Add another statement</p>
        </div>
      </div>
      
      {selectedStatement && (
        <div
          className={`statement-editor-form ${statements.findIndex(s => s.id === selectedStatement.id) % 2 === 0 ? "even-editor" : "odd-editor"}`}
        >
          <h3>Edit Statement</h3>
          <input
            className="form-group"
            value={selectedStatement.text || ""} 
            onChange={(e) => {
              setSelectedStatement({...selectedStatement, text: e.target.value});
              updateStatement(selectedStatement.id, "text", e.target.value);
            }}
            placeholder="Statement text"
          />
          <h3>Question</h3>
          <input
            className="form-group"
            value={selectedStatement.question || ""} 
            onChange={(e) => {
              setSelectedStatement({...selectedStatement, question: e.target.value});
              updateStatement(selectedStatement.id, "question", e.target.value);
            }}
            placeholder="Write your question here"
          />
          <h3>Answer (View Only)</h3>
          <input className="form-group" value={selectedStatement.answer || "Sample Answer"} readOnly />
          <div className="button-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={saveChanges} className="large-grey-btn">Save</button>
            <button onClick={() => deleteStatement(selectedStatement.id)} className="trash-button">
              <FaTrash size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualFlowChartQuiz;
