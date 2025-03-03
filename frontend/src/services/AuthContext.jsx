import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
import { ApiContextProvider } from './api_context';
import { useSearchParams } from 'react-router-dom';

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

    const [user , setUser] = useState(null) // user data accessible across every component regardless of hierarchy
    const [token, setToken] = useState("")


    // Initially load user details if it exists or when re-render triggered
    useEffect( () => {
        const userData = JSON.parse(localStorage.getItem("user")) || null
        setUser(userData)

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
    

    // ===== LOGOUT USER ======

    async function logoutUser() {
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


          //clear state
          setUser("")

          
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


    return (
        <AuthContext.Provider value={{user, loginUser, logoutUser}}>
            {children}
        </AuthContext.Provider>
    )

}

export {AuthContext, AuthContextProvider}