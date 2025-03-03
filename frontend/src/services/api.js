import axios from 'axios';


const baseURL =
  import.meta.env && import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000'; // this should points to Django backend
    
const api = axios.create({
  baseURL, 
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication functions
export async function loginUser(username, password){
  try {
    const response = await api.post(`/api/login/`, {
      username,
      password,
    });
        
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
  
    return response.data;
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


export async function SignUpUser(username, firstName, lastName, userType, password, confirmPassword){
  try {
    const response = await api.post(`/api/signup/`, {
      username,
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
      password,
      confirm_password: confirmPassword,
    });

    return response.data;

  }
  catch(error) {
    console.error("Sign Up error:", error.response?.data || error.message);
    throw new Error("Sign Up failed:" + (error.response?.data?.detail || "Unknown error"));
   }
}

export async function ResetPassword(username, new_password , confirm_new_password){
  try {
    const response = await api.post(`/api/change-password/`, {
      username,
      new_password,
      confirm_new_password
    });

    return response.data;
  }
  catch(error) {
    throw new Error("Reset of password failed:" + (error.response?.data?.detail || "Unknown error"));

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

export default api 




export async function logoutUser() {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Call backend logout endpoint
      await api.post('api/logout/', {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
    }
    
    // Clear all user-related data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login page
    window.location.href = '/';
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if the API call fails, still clear localStorage and redirect
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
    
    throw new Error("Logout failed: " + (error.response?.data?.detail || "Unknown error"));
  }
}