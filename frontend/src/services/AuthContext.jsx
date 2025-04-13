import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
//import { ApiContextProvider } from './api_context';
import { useSearchParams } from 'react-router-dom';


    
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
});

const AuthContext = createContext("")

const AuthContextProvider = ({children}) => {

    const [user , setUser] = useState(null) // user data accessible across every component regardless of hierarchy
    const [token, setToken] = useState("")


    // Initially load user details if it exists or when re-render triggered
    useEffect( () => {

        const userData = JSON.parse(localStorage.getItem("user")) || null
        const userToken = localStorage.getItem("token") || ""

        setUser(userData)
        setToken(userToken)



    }, [])

    useEffect( () => {
        
      if(user){
        localStorage.setItem('user', JSON.stringify(user))
      }
        
    }, [user])


    // ===== UPADING USER ===== //
    async function updateUser(newUserObj){ //parameter must be a copy of the user 

     

     console.log(newUserObj)
      try {
        const { default: api } = await import('./api.js'); // dynamic import
        // const response = await api.put('/api/user/', newUserObj, {
        //   headers: {
        //     'Authorization': `Token ${token}`
        //   }
        // })
        

        const response = await api.put('/api/user/', newUserObj)

        
        if(response && response.data.user){
          console.log(response.data.user)
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setUser(response.data.user)

        }

        

      }catch (error){
        console.error(error)
      }
    }



    // ===== LOGGING IN ====== //

    // async function loginUser(username, password){
       
    //     try {
    //       // First, try logging in with the custom endpoint
    //       const response = await api.post(`/api/login/`, {
    //         username, 
    //         password,
    //       });

    //       // Check if response contains JWT tokens:
    //       if (response.data.jwt) {
    //         // store JWT tokens
    //         localStorage.setItem('token', response.data.jwt.access);
    //         localStorage.setItem('refreshToken', response.data.jwt.refresh)
    //       } else {
    //         // fallback to old token if no JWT
    //         localStorage.setItem('token', response.data.token);
    //       }

    //       // Store user data in localStorage
    //       localStorage.setItem('user', JSON.stringify(response.data.user));
          
          
    //       setUser(response.data.user)
    //       setToken(response.data.jwt?.access || response.data.token);
          
    //       console.log("USER LOADED IN")


    //       return response.data;
    //     }
        
    //     catch(error) {
    //       // if the custom endpoints fails, try JWT endpoint
    //       try {
    //         const jwtResponse = await api.post('api/token/', {
    //           username,
    //           password
    //         });

    //           // Store tokens
    //           localStorage.setItem('token', jwtResponse.data.access);
    //           localStorage.setItem('refreshToken', jwtResponse.data.refresh);

    //           // Fetch user data with the new token
    //           const userResponse = await api.get('/api/profile/', {
    //             headers: {
    //               Authorization: `Bearer ${jwtResponse.data.access}`
    //             }
    //           });
              
    //           localStorage.setItem('user', JSON.stringify(userResponse.data));
    //           setUser(userResponse.data);
    //           setToken(jwtResponse.data.access);
              
    //           return {
    //             user: userResponse.data,
    //             jwt: {
    //               access: jwtResponse.data.access,
    //               refresh: jwtResponse.data.refresh
    //             }
    //           };
      
    //       } catch (jwtError) {
    //         console.error("Both login attempts failed:", error, jwtError);
    //         throw new Error("Login failed:" + error.response?.data?.detail || "Unkown error");
    //       }
      
    //     }
    //   }

    async function loginUser(username, password) {
        // Fall back to old login
        try {
          const response = await api.post(`/api/login/`, {
            username,
            password,
          });
          
          localStorage.setItem('user', JSON.stringify(response.data.user));

          // Check if we received a JWT token or refreshToken
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }

          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
              
          
          setUser(response.data.user);
          // setToken(response.data.token);
          
          return response.data;
        } catch (error) {
          // Ensure user is not set in case of any error
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          throw new Error("Login failed: " + (error.response?.data?.detail || "Unknown error"));
        }
      // }
    }
    


     // ===== SIGNING IN ===== //
    //  Please complete this //
    async function SignUpUser(username, firstName, lastName, password, confirmPassword,email){
        try {
          const response = await api.post(`/api/signup/`, {
            username,
            first_name: firstName,
            last_name: lastName,
            password,
            confirm_password: confirmPassword,
            email,
          });

          // localStorage.setItem('user', JSON.stringify(response.data.user));
          // localStorage.setItem('token', response.data.token);
          
          
          // setUser(response.data.user)
          
          console.log("USER SIGNED UP AND LOGGED IN, pls check email")


      
          return response.data;
      
        }
        catch(error) {
          console.error("Sign Up error: ", error.response?.data || error.message);
          throw new Error("Sign Up failed: " + error.response?.data?.detail || "Unknown error");
         }
    }

    async function VerifyEmail(token){
      try{
        const response = await api.get(`/api/verify-email/${token}/`);
        console.log(response.data.message);
        return response.data
      }
      catch(error) {
        console.error("email verification error: ", error.response?.data || error.message);
        throw new Error("email verification failed: " + error.response?.data?.detail || "Unknown error");
       }
    }

      

    // ===== RESET PASSWORD ===== //

    async function ResetPassword(new_password , confirm_new_password,uidb64,token){
        try {
          const response = await api.post(`/api/password-reset/${uidb64}/${token}/`, {
            new_password,
            confirm_new_password
          });
          

          return response.data;
        }
        catch(error) {
          throw new Error("Reset of password failed: " + (error.response?.data?.detail || "Unknown error"));
      
        }
      }

    async function RequestPasswordReset(email) {
      try{
        const response = await api.post ('/api/password-reset/', {email});
        return response.data;
      }
      catch(error) {
        throw new Error("Password reset request failed: " + (error.response?.data?.detail || "Unknown error"));
      }
    }
    


    // ===== LOGOUT USER ======

    async function logoutUser() {
        try {
          // Get the token from localStorage
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');

          
          if (token) {
            // if using JWT, blacklist the refresh token!
            if (refreshToken) {
              try {
                await api.post('/api/logout/', { refresh: refreshToken });
              } catch (e) {
                console.error("Error blacklisting token:", e);
              }
            } else {
              // fallback to the old logout
              await api.post('/api/logout')
            }
          }
          
          // Clear all user-related data from localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');

          //clear state
          setUser("")
          setToken("");

          // Redirect to login page
          window.location.href = '/';
          
          return { success: true };
        } catch (error) {
          console.error("Logout error:", error);
          
          // Even if the API call fails, still clear localStorage and redirect
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');

          window.location.href = '/';

          
          throw new Error("Logout failed: " + (error.response?.data?.detail || "Unknown error"));
     
        }
    }

                    
    return (
        // DONNOT let setUser be globally accessible, it should be done via updateUser
        <AuthContext.Provider value={{user, token, loginUser, logoutUser, updateUser, SignUpUser, RequestPasswordReset, ResetPassword, VerifyEmail}}>
            {children}
        </AuthContext.Provider>
    )

}

export {AuthContext, AuthContextProvider}