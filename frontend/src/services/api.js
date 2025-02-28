import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

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
        case 'mental health professional':
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
    window.location.href = '/login';
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if the API call fails, still clear localStorage and redirect
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
    
    throw new Error("Logout failed: " + (error.response?.data?.detail || "Unknown error"));
  }
}