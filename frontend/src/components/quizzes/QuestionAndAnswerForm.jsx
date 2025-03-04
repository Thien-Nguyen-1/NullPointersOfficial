import React, { useState } from 'react';

const QuestionAndAnswerForm = ({ onSave }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();  
        onSave({ question, answer });  
        setQuestion('');  
        setAnswer('');  
    };

    return (
        <form className="question-answer-form" onSubmit={handleSubmit}>
            <div className="input-group">
                <label htmlFor="question">Question:</label>
                <input
                    id="question"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label htmlFor="answer">Answer:</label>
                <input
                    id="answer"
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="save-button">Save Question</button>
        </form>
    );
};

export default QuestionAndAnswerForm;
