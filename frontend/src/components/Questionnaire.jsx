import React, { useState, useEffect, useRef} from "react";
import axios from "axios";
import { GetQuestion, SubmitQuestionAnswer } from "../services/api";
// const API_BASE_URL = "/api/questionnaire/";
import { GetResult } from "../services/open_router_chat_api";
import { tagApi } from "../services/api";

const Questionnaire = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const all_responses = useRef("")
   
  useEffect(() => {
    fetchQuestion(); // Fetch the first question when the page loads
  //  GetResult();

    
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

      const nextQuestion = await SubmitQuestionAnswer(question?.id, answer);

      const userResponse = `Question: ${question.question}, User Response: ${answer}, `;
      all_responses.current += userResponse;

      if (nextQuestion.message) {

        alert(nextQuestion.message); // "End of questionnaire" message
      

        const tagsData = await tagApi.getAll();
        const tags = tagsData?.data.map(item => item.tag);


        const response = await GetResult(tags, all_responses.current)

        console.log(response)

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
