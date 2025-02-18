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

export default api 




