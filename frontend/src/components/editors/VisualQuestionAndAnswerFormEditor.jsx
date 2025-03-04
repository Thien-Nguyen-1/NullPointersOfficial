import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/VisualQuestionAndAnswerFormEditor.css';

const VisualQuestionAndAnswerFormEditor = ({ onSave }) => {
    const apiUrl = 'http://localhost:8000/api/question_answer_forms/';
    const [entries, setEntries] = useState([]);
    const [newEntry, setNewEntry] = useState({ question: '', answer: '' });
    const [error, setError] = useState('');

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewEntry({ ...newEntry, [name]: value });
    };

    const handleAddEntry = async () => {
        if (!newEntry.question || !newEntry.answer) {
            setError('Both question and answer fields are required.');
            return;
        }
        try {
            const response = await axios.post(apiUrl, newEntry);
            if (response.data) {
                setEntries([...entries, response.data]);
                setNewEntry({ question: '', answer: '' });
                setError('');
                if (onSave) onSave([...entries, response.data]);
            }
        } catch (err) {
            setError('Failed to save the entry. Please try again.');
            console.error('Error adding entry:', err);
        }
    };

    const handleDeleteEntry = async (id, index) => {
        if (window.confirm("Are you sure you want to delete this entry?")) {
            try {
                await axios.delete(`${apiUrl}${id}`);
                const updatedEntries = entries.filter((_, idx) => idx !== index);
                setEntries(updatedEntries);
                if (onSave) onSave(updatedEntries);
            } catch (err) {
                setError('Failed to delete the entry. Please try again.');
                console.error('Error deleting entry:', err);
            }
        }
    };

    return (
        <div className="visual-qa-form">
            {entries.map((entry, index) => (
                <div key={entry.id || index} className="qa-entry">
                    <div className="question">{entry.question}</div>
                    <div className="answer">{entry.answer}</div>
                    <button onClick={() => handleDeleteEntry(entry.id, index)}>Delete</button>
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
