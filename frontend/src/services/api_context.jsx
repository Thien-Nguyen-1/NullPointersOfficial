import axios from 'axios';
import { createContext, useContext, useState } from 'react';


const baseURL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000'; // Fallback to localhost if no environment variable is found

    
const api = axios.create({
  baseURL: 'http://localhost:8000', //import.meta.env.VITE_API_URL,
  withCredentials: true,
});


const apiContext = createContext("")

const ApiContextProvider = ({children}) => {

  const [user, setUser] = useState("")

  async function loginUser(username, password){

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




  return (
      <apiContext.Provider value = {{user, setUser, loginUser}}>
        {children}
      </apiContext.Provider>

  )


}

export {ApiContextProvider, apiContext}