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

    if(response.data){
      localStorage.setItem("user_type",response.data.user_type);
      return response.data;
    }

    
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

  
export async function getAdminSettings(){
  try{
    
    const response = await api.get(`/admin/settings/`);
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to get admin settings");
  }
}

export async function updateAdminSettings(updatedData){
  try{
    const response = await api.put(`/admin/settings/`, updatedData);
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to update admin settings");
  }
}

export async function deleteAdminSettings(){
  try{
    const response = await api.delete(`/admin/settings/`);
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to delete admin account");
  }
}

export async function changeAdminPassword(oldPassword, newPassword, confirmNewPassword){
  try{
    const token = localStorage.getItem("token");
    const response = await api.put(`admin/password-change/`, {
    old_password:  oldPassword,
    new_password: newPassword,
    confirm_new_password: confirmNewPassword,
    });
    return response.data;
  }
  catch(error){
    throw new Error ("Failed to change password");
  }
}


export default api 




