import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import '../../styles/VisualMatchingQuestionsEditor.css';
import { QuizApiUtils } from "../../services/QuizApiUtils";

const VisualMatchingQuestionsQuizEditor = forwardRef((props, ref) => {
    const [currentPair, setCurrentPair] = useState({ question_text: '', answers: '', order: 0 });
    const [submittedPairs, setSubmittedPairs] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (props.initialQuestions && props.initialQuestions.length > 0) {
            const loadedQuestions = props.initialQuestions.map(q => ({
                ...q,
                question_text: q.text,
                answers: q.answers, // Convert answers array back to string for editing
                order: q.order
            }));
            setSubmittedPairs(loadedQuestions);
        }
    }, [props.initialQuestions]);

    useImperativeHandle(ref, () => ({
        getQuestions: () => submittedPairs
    }));

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setCurrentPair(prev => ({ ...prev, [name]: value }));
    };

    const handleAddOrUpdatePair = (event) => {
        event.preventDefault();
        if (!currentPair.question_text || !currentPair.answers.trim()) {
            setError("Both question and at least one answer must be filled.");
            return;
        }

        // Split and trim answers when adding/updating the pair
        const answersArray = currentPair.answers.split(',').map(answer => answer.trim());

        const updatedPairs = isEditing ?
            submittedPairs.map((pair, idx) => idx === editIndex ? { ...pair, question_text: currentPair.question_text, answers: answersArray } : pair) :
            [...submittedPairs, { ...currentPair, answers: answersArray, id: Date.now() }];

        setSubmittedPairs(updatedPairs);
        setCurrentPair({ question_text: '', answers: '', order: submittedPairs.length + 1 });
        setIsEditing(false);
        setError('');
        setEditIndex(null);
    };

    const handleEdit = (index) => {
        setCurrentPair(submittedPairs[index]);
        setEditIndex(index);
        setIsEditing(true);
    };

    const handleRemove = async(id) => {
        try {
            const result = await QuizApiUtils.deleteQuestion(id);
            if (result) {
                setSubmittedPairs(submittedPairs.filter(entry => entry.id !== id));
            }
        } catch (error) {
            console.log('Failed to delete question from backend:', id);        
            console.error('Failed to delete question from backend:', error);
        }
    };

    return (
        <div ref={ref} className="matching-quiz-editor">
            <h1>Create Matching Question and Answer Pairs</h1>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleAddOrUpdatePair} className="pair-form">
                <input
                    type="text"
                    name="question_text"
                    value={currentPair.question_text}
                    onChange={handleInputChange}
                    placeholder="Enter question"
                    required
                    className="input-field"
                />
                <input
                    type="text"
                    name="answers"
                    value={currentPair.answers}
                    onChange={handleInputChange}
                    placeholder="Enter answers separated by commas"
                    required
                    className="input-field"
                />
                <button type="submit" className="button">
                    {isEditing ? 'Update Pair' : 'Add Pair'}
                </button>
            </form>
            <div className="pairs-list">
                {submittedPairs.map((pair, index) => (
                    <div key={pair.id || index} className="pair-container">
                        <div className="pair-question"><strong>Question:</strong> {pair.question_text}</div>
                        <div className="pair-answer"><strong>Answer:</strong> {pair.answers}</div>
                        <button onClick={() => handleEdit(index)} className="button">Edit</button>
                        <button onClick={() => handleRemove(pair.id)} className="button">Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default VisualMatchingQuestionsQuizEditor;












