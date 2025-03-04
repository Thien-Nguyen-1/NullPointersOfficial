import axios from 'axios';


const baseURL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000';
    
const api = axios.create({
  baseURL,
  withCredentials: true,
});

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
    const response = await api.post(`/login/`, {
      username,
      password,
    });
        
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


export async function SignUpUser(username, firstName, lastName, userType, password, confirmPassword){
  try {
    const response = await api.post(`/signup/`, {
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
    throw new Error("Sign Up failed:" + error.response?.data?.detail || "Unkown error");
   }
}

export async function ResetPassword(username, new_password , confirm_new_password){
  try {
    const response = await api.post(`/change-password/`, {
      username,
      new_password,
      confirm_new_password
    });

    return response.data;
  }
  catch(error) {
    throw new Error("Reset of password failed:" + error.response?.data?.detail || "Unkown error");

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
    const response = await api.put(`worker/password-change/`, {
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


export default api 




export async function logoutUser() {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Call backend logout endpoint
      await api.post('/logout/', {}, {
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