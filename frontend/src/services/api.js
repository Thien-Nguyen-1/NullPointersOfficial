import axios from 'axios';


const baseURL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : process.env.VITE_API_URL || 'http://localhost:3000';
    
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

    return response.data;
  }
  catch(error) {
    throw new Error("Login failed:" + error.response?.data?.detail || "Unkown error");

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

export default api 




