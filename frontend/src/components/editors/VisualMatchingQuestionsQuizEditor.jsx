import React, { useState } from 'react';
import axios from 'axios';

const VisualMatchingQuestionsQuizEditor = () => {
    const apiUrl = 'http://localhost:8000/api/matching_questions/';
    const [pairs, setPairs] = useState([]);
    const [newPair, setNewPair] = useState({ question: '', answer: '' });
    const [error, setError] = useState('');

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewPair({ ...newPair, [name]: value });
    };

    const handleAddPair = async () => {
        if (!newPair.question || !newPair.answer) {
            setError('Both question and answer fields are required.');
            return;
        }

        try {
            const response = await axios.post(apiUrl, newPair);
            setPairs([...pairs, response.data]);
            setNewPair({ question: '', answer: '' }); // Reset form
            setError('');
        } catch (err) {
            setError('Failed to save the pair. Please try again.');
            console.error('Error adding pair:', err);
        }
    };

    return (
        <div className="matching-quiz-editor">
            <h1>Create Matching Question and Answer Pairs</h1>
            <div className="pair-form">
                <input
                    type="text"
                    name="question"
                    value={newPair.question}
                    onChange={handleInputChange}
                    placeholder="Enter question"
                    required
                />
                <input
                    type="text"
                    name="answer"
                    value={newPair.answer}
                    onChange={handleInputChange}
                    placeholder="Enter matching answer"
                    required
                />
                <button onClick={handleAddPair}>Add Pair</button>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="pairs-list">
                {pairs.map((pair, index) => (
                    <div key={index} className="pair">
                        <p><strong>Question:</strong> {pair.question}</p>
                        <p><strong>Answer:</strong> {pair.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualMatchingQuestionsQuizEditor;

