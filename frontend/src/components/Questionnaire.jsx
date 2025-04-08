import React, { useState, useEffect, useRef} from "react";
import axios, { all } from "axios";
import { GetQuestion, SubmitQuestionAnswer, tagApi, moduleApi } from "../services/api";
// const API_BASE_URL = "/api/questionnaire/";
import { GetResult } from "../services/open_router_chat_api";


const Questionnaire = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const all_responses = useRef("")

  const [all_tags, setTag] = useState([])


  const [allModules, setModules] = useState(null)
  
   
  useEffect(() => {
    fetchQuestion(); // Fetch the first question when the page loads
  //  GetResult();

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


  const handleAnswer = async (answer) => {
    try {

      const nextQuestion = await SubmitQuestionAnswer(question?.id, answer);

      if(answer != "no"){
        const userResponse = `Question: ${question.question}, User Response: ${answer}, `;
        all_responses.current += userResponse;
      }

      if (nextQuestion.message) {

        alert(nextQuestion.message); // "End of questionnaire" message

        if(all_responses.current.length == 0){
          console.log("NOTHING")
          setModules([])
        }

      
        const tagsData = await tagApi.getAll();
        const tags = tagsData?.data.map(item => item.tag);

        const response = await GetResult(tags, all_responses.current)

        if(response != "No tags available" ){
          const arr = response.split(',');

          //now filter the modules
          console.log("Responses are , " , arr)
          

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

          setTag(arr)
        } else {
          console.log("BWHAA")
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
  if (error) return <p>{error}</p>;
  if (!question) return <div> 
   <h1> Questionnaire complete! </h1>

   

    { allModules.map( (modObj) => {
        console.log(modObj)
       return( <h1 key={modObj.id}> {modObj.title} </h1>)
  })}
    
    
    </div>;

  return (
    <div>
      
      <h2>{question.question}</h2>
      <button onClick={() => handleAnswer("yes")}>Yes</button>
      <button onClick={() => handleAnswer("no")}>No</button>

      

    </div>
  );
};

export default Questionnaire;
