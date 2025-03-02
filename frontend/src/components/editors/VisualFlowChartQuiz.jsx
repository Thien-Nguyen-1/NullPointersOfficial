import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import "../../styles/MainQuizContainer.css";

function VisualFlowChartQuiz() {
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);

  const addStatement = () => {
    setStatements([...statements, { id: Date.now(), text: "", question: "", answer: "Sample Answer" }]);
  };

  const updateStatement = (id, field, value) => {
    setStatements(statements.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteStatement = (id) => {
    setStatements(statements.filter(s => s.id !== id));
    setSelectedStatement(null);
  };

  const saveChanges = () => {
    alert("Changes saved successfully!");
  };

  return (
    <div className="visual-sequence-editor">
      <div className="sequence-flow">
        {statements.map((statement, index) => (
          <>
            {index > 0 && (
              <div
                className={`sequence-arrow ${index % 2 === 0 ? "even-arrow" : "odd-arrow"}`}
              >
                &#x276D;&#x276D;&#x276D;
              </div>
            )}
            <div
                key={statement.id}
                className={`sequence-item ${index % 2 === 0 ? "even-editor" : "odd-editor"} ${selectedStatement?.id === statement.id ? "selected" : ""}`}
                onClick={() => setSelectedStatement(statement)}
                >
                <p className="statement-content">{statement.text}</p>
            </div>
          </>
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
            value={selectedStatement.text} onChange={(e) => {
  setSelectedStatement({...selectedStatement, text: e.target.value});
  updateStatement(selectedStatement.id, "text", e.target.value);
}}
            placeholder="Statement text"
          />
          <h3>Question</h3>
          <input
            className="form-group"
            value={selectedStatement.question} onChange={(e) => {
  setSelectedStatement({...selectedStatement, question: e.target.value});
  updateStatement(selectedStatement.id, "question", e.target.value);
}}
            placeholder="Write your question here"
          />
          <h3>Answer (View Only)</h3>
          <input className="form-group" value={selectedStatement.answer} readOnly />
          <div className="button-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>            <button onClick={saveChanges} className="large-grey-btn">Save</button>
            <button onClick={() => deleteStatement(selectedStatement.id)} className="trash-button">
  <FaTrash size={20}  /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualFlowChartQuiz;
