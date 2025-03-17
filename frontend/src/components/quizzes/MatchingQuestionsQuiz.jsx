import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuizApiUtils } from "../../services/QuizApiUtils";
import '../../styles/MatchingQuestionsUserDisplay.css';

const MatchingQuestionsQuiz = ({ taskId, userToken }) => {
    const [pairs, setPairs] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPairs = async () => {
            try {
                console.log("Fetching quiz data for task:", taskId);
                setIsLoading(true);
                const fetchedPairs = await QuizApiUtils.getQuestions(taskId);
                if (fetchedPairs && fetchedPairs.length > 0) {
                    setPairs(fetchedPairs);
                    console.log("Quiz data fetched:", fetchedPairs);
                } else {
                    setError("No data available.");
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data.");
                setIsLoading(false);
            }
        };
        fetchPairs();
    }, [taskId]);

    const handleDrop = (questionId, answer) => {
        console.log(`Dropping answer '${answer}' for question ID ${questionId}`);
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmitAnswers = async () => {
        console.log("Initiating answer submission for quiz:", taskId);
        try {
            const result = await QuizApiUtils.submitQuizAnswers(taskId, userAnswers, userToken);
            console.log("Answers submission result:", result);
        } catch (error) {
            console.error("Failed to submit answers:", error);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container">
            <h1>Questions and Answers</h1>
            <ul>
                {pairs.map(pair => (
                    <li key={pair.id} className="question-answer-pair">
                        <Question text={pair.text} id={pair.id} />
                        <div className="answers">
                            {pair.answers.map((answer, index) => (
                                <Answer key={index} answer={answer} onDrop={handleDrop} questionId={pair.id} />
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




