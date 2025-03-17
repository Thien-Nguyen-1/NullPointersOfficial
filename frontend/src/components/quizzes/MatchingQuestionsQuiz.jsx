import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuizApiUtils } from "../../services/QuizApiUtils";
import '../../styles/MatchingQuestionsUserDisplay.css';

const MatchingQuestionsQuiz = ({ taskId, onComplete }) => {
    const [pairs, setPairs] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [validationAttempted, setValidationAttempted] = useState(false);

    useEffect(() => {
        const fetchPairs = async () => {
            setIsLoading(true);
            try {
                const fetchedPairs = await QuizApiUtils.getQuestions(taskId);
                if (fetchedPairs && fetchedPairs.length > 0) {
                    const pairsWithDefaultAnswers = fetchedPairs.map(pair => ({
                        ...pair,
                        answers: Array.isArray(pair.answers) ? pair.answers : []
                    }));
                    setPairs(pairsWithDefaultAnswers.sort((a, b) => a.order - b.order));
                } else {
                    setError("No data available.");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data.");
            }
            setIsLoading(false);
        };

        fetchPairs();
    }, [taskId]);

    const handleDrop = (questionId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const validateQuiz = () => {
        const errors = {};
        let hasErrors = false;

        pairs.forEach(pair => {
            const answer = userAnswers[pair.id];
            if (!answer) {
                errors[pair.id] = 'Answer required';
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        setValidationAttempted(true);
        return !hasErrors;
    };

    const handleSubmitAnswers = () => {
        if (validateQuiz()) {
            onComplete(userAnswers);
            setQuizCompleted(true);
        } else {
            console.error("Validation failed, not all questions answered.");
        }
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setValidationErrors({});
        setValidationAttempted(false);
        setQuizCompleted(false);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (quizCompleted) {
        return (
            <div className="quiz-completed">
                <h3>Quiz completed successfully!</h3>
                <button onClick={resetQuiz} className="restart-button">Try Again</button>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Drag and Drop Question to Answer</h1>
            <ul>
                {pairs.map((pair) => (
                    <li key={pair.id} className={`question-answer-pair ${validationErrors[pair.id] ? 'error' : ''}`}>
                        <Question text={pair.text} id={pair.id} />
                        <div className="answers">
                            {pair.answers.map((answer, idx) => (
                                <Answer key={idx} answer={answer} onDrop={handleDrop} questionId={pair.id} />
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
            <button onClick={handleSubmitAnswers}>Submit Answers</button>
        </div>
    );
};

const Question = ({ text, id }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'question',
        item: { id },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className="question">
            {text}
        </div>
    );
};

const Answer = ({ answer, onDrop, questionId }) => {
    const [, drop] = useDrop({
        accept: 'question',
        drop: (item) => onDrop(questionId, answer),
    });

    return (
        <div ref={drop} className="answer">
            {answer}
        </div>
    );
};

export default MatchingQuestionsQuiz;


