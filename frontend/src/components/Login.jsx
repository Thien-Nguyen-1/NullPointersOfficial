import React, { useState } from "react";
import {loginUser} from "../services/api";
import { useNavigate } from "react-router-dom";
import '../styles/Login.css';


const Login = () => {

    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

  const handleLogin = async(e) => {
    e.preventDefault();
    try {
      const data = await loginUser(username, password);
      redirectBasedOnUserType(data);
    } catch(err) {
      setError("Invalid username or password");
    }
  }

  return (
    <div className = "login-container">
        <div className = "login-box">
            <h2>Log in page</h2>
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
        <div className="login-links">
        <button  onClick={() => navigate("/")}>
          Back
        </button>
        <button  onClick={() => navigate("/change-password")}>
          Forgot password
        </button>
        <button  onClick={() => navigate("/signup")}>
          Don't have an account
        </button>
    </div>
    </div>
    </div>
    
 
  );
};

export default Login;