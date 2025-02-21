import React from 'react';
import { useState } from "react";
import {loginUser} from "../services/api";


const Login = () => {

    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleLogin = async(e) => {
        e.preventDefault();
        try{
            const data = await loginUser(username, password);
            console.log("Login succesful:" , data)
            alert("Log in worked " + username)
            
        }
        catch(err){
            setError("Invalid username or password");
        }
    }



  return (
    <div className = 'conatiner'>
        <div className = "header">
            <div className ="text">Log in page</div>
            <div className ="underline"></div>
        </div>
        <form onSubmit={handleLogin}>
            <input
                type ="text"
                value ={ username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
            />
            <input 
                type ="password"
                value = {password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <button type ="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
    </div>
 
  );
};

export default Login;
