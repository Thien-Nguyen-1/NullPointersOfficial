import React, { useState, useEffect } from "react";
import axios from "axios";
import { GetQuestion, SubmitQuestionAnswer } from "../services/api";
// const API_BASE_URL = "/api/questionnaire/";

const Questionnaire = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestion(); // Fetch the first question when the page loads
  }, []);

  const fetchQuestion = async (id = null) => {
    try {
      console.log("Fetching questions")
      setLoading(true);
      const fetchedQuestion = await GetQuestion(id);
      
      setQuestion(fetchedQuestion);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    try {

      const nextQuestion = await SubmitQuestionAnswer(question?.id, answer)

      if (nextQuestion.message) {
        alert(nextQuestion.message); // "End of questionnaire" message
        setQuestion(null);
      } else {
        setQuestion(nextQuestion);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!question) return <p>Questionnaire complete!</p>;

  return (
    <div>
      <h2>{question.question}</h2>
      <button onClick={() => handleAnswer("yes")}>Yes</button>
      <button onClick={() => handleAnswer("no")}>No</button>
    </div>
  );
};

export default Questionnaire;
