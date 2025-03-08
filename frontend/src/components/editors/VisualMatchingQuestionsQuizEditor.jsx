import React, { useState, forwardRef, useImperativeHandle } from 'react';
import '../../styles/VisualMatchingQuestionsEditor.css';

const VisualMatchingQuestionsQuizEditor = forwardRef((props, ref) => {
    const [pairs, setPairs] = useState([]);
    const [newPair, setNewPair] = useState({ question: '', answer: '' });
    const [error, setError] = useState('');

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        getPairs: () => pairs,

        addPair: (pair) => {
            setPairs(prevPairs => [...prevPairs, pair]);
        },
        removePair: (index) => {
            setPairs(prevPairs => prevPairs.filter((_, idx) => idx !== index));
        }
    }));

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewPair(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPair = (event) => {
        event.preventDefault();
        if (!newPair.question || !newPair.answer) {
            setError("Both question and answer fields must be filled.");
            return;
        }
        setPairs([...pairs, newPair]);
        setNewPair({ question: '', answer: '' });
        setError('');
    };

    return (
        <div ref={ref} className="matching-quiz-editor">
            <h1>Create Matching Question and Answer Pairs</h1>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleAddPair} className="pair-form">
                <input
                    type="text"
                    name="question"
                    value={newPair.question}
                    onChange={handleInputChange}
                    placeholder="Enter question"
                    required
                    className="input-field"
                />
                <input
                    type="text"
                    name="answer"
                    value={newPair.answer}
                    onChange={handleInputChange}
                    placeholder="Enter answer"
                    required
                    className="input-field"
                />
                <button type="submit" className="button">Add Pair</button>
            </form>
            <div className="pairs-list">
                {pairs.map((pair, index) => (
                    <div key={index} className="pair-container">
                        <div className="pair-question"><strong>Question:</strong> {pair.question}</div>
                        <div className="pair-answer"><strong>Answer:</strong> {pair.answer}</div>
                        <button onClick={() => {
                            setPairs(currentPairs => currentPairs.filter((_, idx) => idx !== index));
                        }} className="button">Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default VisualMatchingQuestionsQuizEditor;









