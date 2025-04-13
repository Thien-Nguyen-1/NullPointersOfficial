import React, { useState, useEffect, useRef, useContext} from "react";
import axios, { all } from "axios";
import { GetQuestion, SubmitQuestionAnswer, tagApi, moduleApi } from "../services/api";

import { GetResult } from "../services/open_router_chat_api";
import "../styles/Questionnaire.css";
import ModuleSuggestionBox from "./questionnaire/ModuleSuggestion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";


const Questionnaire = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const all_responses = useRef("")
  const [selectedButton, setButton] = useState("newest");

  const [all_tags, setTag] = useState([])
  const buttonOptions = ["yes", "no"];

  const [allModules, setModules] = useState(null)

  const location = useLocation();
  const navigate = useNavigate();

  const {user, updateUser} = useContext(AuthContext)
  
  
   
  useEffect(() => {
    fetchQuestion(); // Fetch the first question when the page loads
 

    fetchModulesAndTags();

    
  }, []);

  useEffect( () => {
    
  }, )

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

  const fetchModulesAndTags = async () => {
    try {
      
    
      const allModules = await moduleApi.getAll();
      console.log(allModules.data)
      setModules(allModules.data);

    } catch(err) {
      setError(err.message)
    }
  }

  const redirectDashboard = async () => {
      
    console.log("REDIRECTING SETTING USER TO FIRST LOGIN NOT")

      const newUsr = {
        ...user,
        is_first_login : false,
        tags: all_tags
      }
    
      console.log(newUsr.is_first_login)
     
      await updateUser(newUsr)
    
      navigate('/worker/home')

  }


  const handleAnswer = async (answer) => {
    try {

      const nextQuestion = await SubmitQuestionAnswer(question?.id, answer);
      
      if(answer != "no" && question.question != "Are you ready to return to work?"){
        const userResponse = `Question: ${question.question}, User Response: ${answer}, `;
        all_responses.current += userResponse;
      }

      if (nextQuestion.message) {

        alert(nextQuestion.message); // "End of questionnaire" message

        if(all_responses.current.length == 0){
          setModules([])
        }

      
        const tagsData = await tagApi.getAll();
        const tags = tagsData?.data.map(item => item.tag);

        const response = await GetResult(tags, all_responses.current)

        if(response != "No tags available" ){
          const arr = response.split(',');

          console.log("Responses are , " , arr)
          
          const allTags = await tagApi.getAll()

          const usrTags = allTags?.data.filter((tagObj) => arr.includes(tagObj.tag))
          
        
          const newMods = await Promise.all(
            allModules?.map(async (modObj) => {

              const modTags = await Promise.all(

                modObj.tags.map(async (tag) => {
                  const actualTag = (await tagApi.getById(tag))?.data.tag;
                  return actualTag;
                })

              );
  
              return modTags.some(tag => arr.includes(tag)) ? modObj : null;
            })
          );
  
          // Remove any null entries (where no match was found)
          const filteredModules = newMods.filter(modObj => modObj !== null);
          
          console.log(filteredModules)
          setModules(filteredModules)

          setTag(usrTags)
        }

        setQuestion(null);

      } else {
        setQuestion(nextQuestion);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return  navigate('/worker/home');
  if (!question) return (
  <>
  <div className="suggestion-container mb-2 mt-2"> 
    <h2> Thank you for completing the Questionnaire </h2>
    <p> Based on your feedback, here are the modules you may be interested in enrolling: </p>
   </div>

    
    <div className="suggestion-container">
    { allModules.map( (modObj) => {
          console.log(modObj)
        return( <ModuleSuggestionBox 
          key={`suggestion-${modObj.id}`}
          title={modObj.title}
          description={modObj.description}/>)
    })}

      <button onClick={redirectDashboard}> Continue </button>

    </div>

   
      
    </>);

  return (
  
      <div>
        <div className="question-container">
          <p className="question-name">{question.question}</p>
        </div>
        <div className="button-container">
          {buttonOptions.map((option) => (
            <label key={option} className="radio-button">
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selectedButton === option}
                onChange={() => setButton(option)}
              />
              <span className="custom-radio"></span> {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}
        </div>
        <button className="submit" onClick={() => handleAnswer(selectedButton)}>Submit</button>
        
    </div>

    
  );
};

export default Questionnaire;


