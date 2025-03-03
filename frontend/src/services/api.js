import axios from 'axios';


const baseURL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000'; // Fallback to localhost if no environment variable is found

    
const api = axios.create({
  baseURL: 'http://localhost:8000', //import.meta.env.VITE_API_URL,
  withCredentials: true,
});


export function redirectBasedOnUserType(userData) {
  const userType = userData.user.user_type;
    switch(userType) {
        case 'admin':
            window.location.href = '/admin/home';
            break;
        case 'service user':
            window.location.href = '/worker/home';
            break;
        default:
            window.location.href = '/worker/home';
    }

}

export async function GetQuestion(id = null) {
  try {
    const response = await api.get("/questionnaire/", { params: { id }});

    return response.data;

  } catch (err) {
    throw new Error("Failed to load question");
  }
};

export async function SubmitQuestionAnswer(question_id, answer) {
  try {
    const response = await api.post("/questionnaire/", {
      question_id: question_id,
      answer: answer,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  } catch (err) {
    throw new Error("Failed to submit answer");
  } 
};



export default api 