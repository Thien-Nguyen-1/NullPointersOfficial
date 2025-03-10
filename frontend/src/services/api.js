import axios from 'axios';


const baseURL =
  import.meta.env && import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000'; 

    
const api = axios.create({
  baseURL: 'http://localhost:8000', //import.meta.env.VITE_API_URL,
  withCredentials: true,
});

//Anything affiliated with the model User, please make amendments to AuthContext.jsx

// Generic fetch function for users
const fetchData = async (endpoint) => {
  try {
    const response = await api.get(`${endpoint}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw new Error(`Failed to fetch ${endpoint}`);
  }
};

export const fetchServiceUsers = () => fetchData("service-users");

export const deleteServiceUser = async (username) => {
    try {
        const response = await api.delete(`/service-users/${username}/`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${username}:`, error);
        throw error;
    }
};

// export async function loginUser(username, password){
//   try {
//     const response = await api.post(`/login/`, {
//       username,
//       password,
//     });
export async function loginUser(username, password){
  try {
    const response = await api.post(`/api/login/`, {
      username,
      password,
    })
  
        
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
  
    return response.data;

    if(response.data){
      localStorage.setItem("user_type",response.data.user_type);
      return response.data;
    }

    
  }
  catch(error) {
    throw new Error("Login failed:" + error.response?.data?.detail || "Unkown error");

  }
}

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

  
export async function getUserSettings(){
  
  try{
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');

    }
    
    const response = await api.get(`/worker/settings/` , {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to get user settings", error.response?.data || error.message);
  }
}


export async function deleteUserSettings(){
  try{
    const token = localStorage.getItem('token');
    const response = await api.delete(`/worker/settings/`, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to delete user account");
  }
}



export async function changeUserPassword(oldPassword, newPassword, confirmNewPassword){
  try{
    const token = localStorage.getItem("token");
    const response = await api.put(`/api/worker/password-change/`, {
    old_password:  oldPassword,
    new_password: newPassword,
    confirm_new_password: confirmNewPassword,
    
    } , {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to change password");
    
  }
}



export async function GetModule(id){
  try {

    const response = await api.get(`/modules/${ id !== undefined ? id : ""}`)

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;

  } catch (err){
    throw new Error("Failed to retrieve modules")
  }
}

export async function GetAllProgressTracker(){
  try {
   
    const response = await api.get(`/api/progress-tracker/`)

    if(response.error){
      throw new Error(response.error);
    }

    return response.data;
  } catch(err){

    return []

  }

}

export async function SaveProgressTracker(tracker, id){
  try{

    const response = await api.put(`/api/progress-tracker/${id}`, tracker)

    if(response.error){
      throw new Error(response.error);
    }

    return response.data

  } catch(err){
    return []
  }
}


export async function GetUserModuleInteract(token){
  try {
   
    const response = await api.get(`/api/user-interaction/`, {
      params: {"filter": "user" },
      headers: {
        'Authorization': `Token ${token}`
      }
     
    });
      

    if(response.error){
      throw new Error(response.error);
    } 
    else if(response.status === 204 ){
      return []
    } 
   
    return response.data;

  } catch(err){

    return []

  }

}


export async function SaveUserModuleInteract(modId, objInteract, token) {
 
  try {
    
    const response = await api.post(`api/user-interaction/${modId}/`, objInteract, { headers: {'Authorization': `Token ${token}`}})

    if(response.error){
      throw new Error(response.error);
    }

    return response.data

  } catch(err){
    throw new Error("Unable to save user module interaction")
  }
}


// Module related functions
export const moduleApi = {
  getAll: () => api.get('/api/modules/'),
  getById: (id) => api.get(`/api/modules/${id}/`),
  create: (data) => api.post('/api/modules/', data),
  update: (id, data) => api.put(`/api/modules/${id}/`, data),
  delete: (id) => api.delete(`/api/modules/${id}/`)
};

// Tag related functions
export const tagApi = {
  getAll: () => api.get('/api/tags/'),
  getById: (id) => api.get(`/api/tags/${id}/`),
  create: (data) => api.post('/api/tags/', data)
};

// Task related functions
export const taskApi = {
  getAll: (moduleId) => api.get('/api/tasks/', { params: { moduleID: moduleId } }),
  getById: (id) => api.get(`/api/tasks/${id}/`),
  create: (data) => api.post('/api/tasks/', data),
  update: (id, data) => api.put(`/api/tasks/${id}/`, data),
  delete: (id) => api.delete(`/api/tasks/${id}/`)
};

// Quiz question related functions
export const quizApi = {
  getQuestions: (taskId) => api.get('/api/quiz/questions/', { params: { task_id: taskId } }),
  getQuestion: (id) => api.get(`/api/quiz/questions/${id}/`),
  createQuestion: (data) => api.post('/api/quiz/questions/', data),
  updateQuestion: (id, data) => api.put(`/api/quiz/questions/${id}/`, data),
  deleteQuestion: (id) => api.delete(`/api/quiz/questions/${id}/`),
  getQuizDetails: (taskId) => api.get(`/api/quiz/${taskId}/`),
  submitResponse: (data) => api.post('/api/quiz/response/', data)
};

export const downloadCompletedTask = async(taskId, token) => {
  try {
    const response = await api.get('/api/download-completed-task/<uuid:task_id>/',{
      headers:{
        Authorization: `Token ${token}`,
        Accept: "application/pdf",
      },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Task_${taskId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    console.log("PDF download started.");
  } 
  catch (error) {
    console.error("Error downloading PDF:", error.response?.data || error.message);
    throw error;
  }

  };

  
export default api;