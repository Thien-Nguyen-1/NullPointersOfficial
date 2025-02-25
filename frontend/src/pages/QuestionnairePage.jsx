import React, { useState, useEffect } from "react";
import axios from "axios";

// const API_BASE_URL = "/api/questionnaire/";

const QuestionnairePage = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestion(); // Fetch the first question when the page loads
  }, []);

  const fetchQuestion = async (id = null) => {
    try {
      setLoading(true);
      const response = await axios.get("/api/questionnaire/", { params: { id } });
      // console.log("API response:", response.data);

      setQuestion(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load question");
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    // console.log("Current Question State:", question);
    try {
      // if (!question?.id) {
      //   console.error("No question ID found.");
      //   return;
      // }

      const response = await axios.post("/api/questionnaire/", {
        question_id: question?.id,
        answer: answer,
      });

      // console.log(response);

      if (response.data.message) {
        alert(response.data.message); // "End of questionnaire" message
        setQuestion(null);
      } else {
        setQuestion(response.data);
      }
    } catch (err) {
      setError("Failed to submit answer", err);
    }
  };

  // console.log("Current question state:", question);

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

export default QuestionnairePage;
