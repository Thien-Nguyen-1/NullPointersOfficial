import axios from 'axios';


// Determine the base URL using environment variables
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with the determined baseURL
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json', // headers property sets default http headers that will be included in all requests made by this api instance
  }
});

//Anything affiliated with the model User, please make amendments to AuthContext.jsx

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  // Check if it's a JWT token (usually they start with 'ey')
  // A typical JWT token is a Base64-encoded string and commonly starts with 'ey'
  if (token && token.startsWith('ey')) {
    return `Bearer ${token}`; // JWTs are usually sent in an Authorization header as a "Bearer" token.
  } else if (token) {
    return `Token ${token}`; // If there's a token but it doesn't start with 'ey', it assumes it's some other type of token 
  }
  return null;
};

// A REQUEST interceptor to include the auth token in all requests 
api.interceptors.request.use(
  (config) => {
    // ONLY FOR DEBUGGING
    const token = localStorage.getItem('token')
    console.log('token:', localStorage.getItem('token'));

    const authHeader = getAuthHeader();
    if (authHeader) {
      // If a token exists, it adds it to the Authorization header of the request.
      config.headers.Authorization = authHeader;
    }
    return config;
    // Ensures that all API requests automatically include authentication credentials.
  },
  (error) => Promise.reject(error)
);

// A RESPONSE interceptor to handle token refresh
// This code automatically renews users access when possible. 
// However, if the renewal fails, it logs users out and asks users to sign in again.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken
          });
          
          // Store the new access token
          localStorage.setItem('token', response.data.access);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);


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


export async function loginUser(username, password){
  try {
    const response = await api.post(`/api/login/`, {
      username,
      password,
    });
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.getItem('token', response.data.token)
    console.log('token after login:', response.data.token);
    if (response.data.access && response.data.refresh) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
    } else if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    
    if(response.data){
      localStorage.setItem("user_type",response.data.user_type);
      return response.data;
    }

    
  }
  catch(error) {
    if (error.response?.status === 403 && error.response?.data?.verification_required) {
      throw new Error(error.response.data.error || "Please verify your email before logging in.");
    }
    throw new Error("Login failed:" + (error.response?.data?.detail || error.response?.data?.error || "Unknown error"));

  }
}

export function redirectBasedOnUserType(userData) {
  const userType = userData.user.user_type;
  console.log("userType detected:", userType); // See what it finds
    switch(userType) {
        case 'superadmin':
            console.log("Redirecting to superadmin/home");
            window.location.href = '/superadmin/home';
            break;
        case 'admin':
            console.log("Redirecting to admin/home");
            window.location.href = '/admin/home';
            break;
        case 'service user':
            console.log("Redirecting to worker/home");
            window.location.href = '/worker/home';
            break;
        default:
            console.log("Default case, redirecting to worker/home. User type:", userType);
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
    const response = await api.get(`/worker/settings/`);

    return response.data;
  }
  catch(error){
    throw new Error ("Failed to get user settings", (error.response?.data || error.message));
  }
}


export async function deleteUserSettings(){
  try{
    const response = await api.delete(`/worker/settings/`);
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
      confirm_new_password: confirmNewPassword});
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
   
    // const response = await api.get(`/api/user-interaction/`, {
    //   params: {"filter": "user" },
    //   headers: {
    //     'Authorization': `Token ${token}`
    //   }
     
    // });

    const response = await api.get(`/api/user-interaction/`, {
      params: {"filter": "user" }});
      

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
    
    // const response = await api.post(`api/user-interaction/${modId}/`, objInteract, { headers: {'Authorization': `Token ${token}`}})
    const response = await api.post(`api/user-interaction/${modId}/`, objInteract);

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

//get the task that needs downloading nd the authentication token
export const downloadCompletedTask = async(taskId, token) => {
  try {
    const response = await api.get(`/api/download-completed-task/${taskId}/`,{
      headers:{
        Authorization: `Token ${token}`,
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

  /**
   * Get all progress tracker entries for the current user
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Array of progress tracker entries
   */
  export const GetUserProgressTrackers = async (token) => {
    try {
        // const response = await api.get('/api/progress-tracker/', {
        //     headers: { Authorization: `Token ${token}` }
        // });

        const response = await api.get('/api/progress-tracker/');
        return response.data;
    } catch (error) {
        console.error("Error fetching user progress trackers:", error);
        return [];
    }
  };

  /**
  * Check if a user is enrolled in a specific module
  * @param {number} userId - User ID
  * @param {number} moduleId - Module ID
  * @param {string} token - Authentication token
  * @returns {Promise<boolean>} True if enrolled, false otherwise
  */
  export const CheckModuleEnrollment = async (userId, moduleId, token) => {
    try {
        // const response = await api.get('/api/progress-tracker/', {
        //     headers: { Authorization: `Token ${token}` }
        // });

        const response = await api.get('/api/progress-tracker/');
        
        // Check if any progress tracker entry exists for this user and module
        return response.data.some(tracker => 
            tracker.user === userId && tracker.module === moduleId
        );
    } catch (error) {
        console.error("Error checking module enrollment:", error);
        return false;
    }
  };

/**
 * Mark content as viewed/completed
 * @param {string} contentId - The ID of the content
 * @param {string} contentType - The type of content (infosheet, video, quiz)
 * @param {string} token - The user's auth token
 * @returns {Promise} - The response from the API
 */
export const markContentAsViewed = async (contentId, contentType, token) => {
  try {
    console.log("Request payload:", {
      content_id: contentId,
      content_type: contentType
    });
    
    
    const response = await fetch('/api/content-progress/mark-viewed/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content_id: contentId,
        content_type: contentType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status}: ${response.statusText}`, errorText);
      throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to mark content as viewed:", error);
    throw error;
  }
};


export const fetchCompletedInteractiveContent = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found");
    return [];
  }

  try {
    const response = await api.get('/api/completed-interactive-content/',{
      headers: {
        Authorization: `Token ${token}`
      }
    });

    return response.data;
    
  } catch (error) {
    console.error("Error fetching completed interactive content:", error);
    return [];
  }
};

export default api;