import React, { useState } from 'react';
import '../../styles/VisualQuestionAndAnswerFormEditor.css'
const VisualQuestionAndAnswerFormEditor = ({ onSave }) => {
    const [entries, setEntries] = useState([]);
    const [newEntry, setNewEntry] = useState({ question: '', answer: '' });
    const [error, setError] = useState('');

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewEntry({ ...newEntry, [name]: value });
    };

    const handleAddEntry = () => {
        if (!newEntry.question || !newEntry.answer) {
            setError('Both question and answer fields are required.');
            return;
        }
        setEntries([...entries, newEntry]);
        setNewEntry({ question: '', answer: '' });
        setError('');
        if (onSave) onSave(entries);
    };

    const handleDeleteEntry = (index) => {
        const updatedEntries = entries.filter((_, idx) => idx !== index);
        setEntries(updatedEntries);
        if (onSave) onSave(updatedEntries);
    };

    return (
        <div className="visual-qa-form">
            {entries.map((entry, index) => (
                <div key={index} className="qa-entry">
                    <div className="question">{entry.question}</div>
                    <div className="answer">{entry.answer}</div>
                    <button onClick={() => handleDeleteEntry(index)}>Delete</button>
                </div>
            ))}
            <div className="new-entry">
                <h1>Question</h1>
                <input
                    type="text"
                    name="question"
                    value={newEntry.question}
                    onChange={handleInputChange}
                    placeholder="Enter question"
                    required
                />
                <h1>Answer</h1>
                <input
                    type="text"
                    name="answer"
                    value={newEntry.answer}
                    onChange={handleInputChange}
                    placeholder="Enter answer"
                    required
                />
                <button onClick={handleAddEntry}>Add</button>
            </div>
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default VisualQuestionAndAnswerFormEditor;
