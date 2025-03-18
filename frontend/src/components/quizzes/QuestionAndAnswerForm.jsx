import React, { useState, useEffect } from 'react';
import { QuizApiUtils } from "../../services/QuizApiUtils";

const QuestionAndAnswerForm = ({ taskId, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizCompleted, setQuizCompleted] = useState(false); // New state for tracking quiz completion

    useEffect(() => {
        fetchQuestions();
    }, [taskId]);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const fetchedQuestions = await QuizApiUtils.getQuestions(taskId);
            if (fetchedQuestions && fetchedQuestions.length > 0) {
                setQuestions(fetchedQuestions);
                initializeAnswers(fetchedQuestions);
            } else {
                setError("No questions available.");
            }
        } catch (err) {
            setError("Failed to load questions: " + err.message);
        }
        setIsLoading(false);
    };

    const initializeAnswers = (questions) => {
        const initialAnswers = questions.reduce((acc, question) => {
            acc[question.id] = ''; // Initialize each answer as empty
            return acc;
        }, {});
        setAnswers(initialAnswers);
        setQuizCompleted(false); // Reset quiz completion status
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const hasEmptyAnswers = Object.values(answers).some(answer => answer === '');
        if (hasEmptyAnswers) {
            alert('Please answer all questions before submitting.');
            return;
        }
        onComplete(answers);
        setQuizCompleted(true); // Set the quiz as completed
    };

    const handleRestart = () => {
        initializeAnswers(questions); // Reset answers and quiz state
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <form className="question-answer-form" onSubmit={handleSubmit}>
            {questions.map((question) => (
                <div key={question.id} className="input-group">
                    <label htmlFor={`question-${question.id}`}>Question:</label>
                    <input
                        id={`question-${question.id}`}
                        type="text"
                        value={question.text}
                        readOnly
                        required
                    />
                    <input
                        id={`answer-${question.id}`}
                        type="text"
                        value={answers[question.id]}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required
                    />
                </div>
            ))}
            {quizCompleted ? (
                <button type="button" className="restart-button" onClick={handleRestart}>Restart Quiz</button>
            ) : (
                <button type="submit" className="save-button">Submit All Answers</button>
            )}
        </form>
    );
};

export default QuestionAndAnswerForm;


