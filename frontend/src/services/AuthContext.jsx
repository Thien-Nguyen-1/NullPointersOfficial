import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
import { ApiContextProvider } from './api_context';

/* const baseURL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000';   */ //just why?

    
const api = axios.create({
  baseURL: 'http://localhost:8000', //import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const AuthContext = createContext("")

const AuthContextProvider = ({children}) => {

    const [user , setUser] = useState("") // user data accessible across every component regardless of hierarchy
    const [token, setToken] = useState("")

    
    // Initially load user details if it exists
    useEffect( () => {


    }, [])


    // ===== LOGGING IN ===== //

    async function loginUser(username, password){
       
        try {
          const response = await api.post(`/api/login/`, {
            username, 
            password,
          });
              
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          
          setUser(response.data.user)

          return response.data;
        }
        
        catch(error) {
          throw new Error("Login failed:" + error.response?.data?.detail || "Unkown error");
      
        }
      }
    

     // ===== SIGNING IN ===== //
    
    async function SignUpUser(username, firstName, lastName, userType, password, confirmPassword){
        try {
          const response = await api.post(`/api/signup/`, {
            username,
            first_name: firstName,
            last_name: lastName,
            user_type: userType,
            password,
            confirm_password: confirmPassword,
          });

          setUser(response.data.user)
      
          return response.data;
      
        }
        catch(error) {
          console.error("Sign Up error:", error.response?.data || error.message);
          throw new Error("Sign Up failed:" + error.response?.data?.detail || "Unkown error");
         }
    }


    // ===== RESET PASSWORD ===== //

    async function ResetPassword(username, new_password , confirm_new_password){
        try {
          const response = await api.post(`/api/change-password`, {
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



    return (
        <AuthContext.Provider value={{user, loginUser}}>
            {children}
        </AuthContext.Provider>
    )

}

export {AuthContext, AuthContextProvider}