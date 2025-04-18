import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/Login.css';
import { AuthContext } from "../../services/AuthContext";
import {redirectBasedOnUserType } from "../../services/api";


const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const {loginUser} = useContext(AuthContext) 
  
  const handleLogin = async(e) => {
    e.preventDefault();
    try {
      const data = await loginUser(username, password);
      redirectBasedOnUserType(data);

    } catch(err) {
      console.log()
      setError("Invalid username or password");
    }
  }
  
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Log in page</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          
          <button type="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="login-links">
          <button onClick={() => navigate("/")}>
            Back
          </button>
          <button onClick={() => navigate("/password-reset")}>
            Forgot password
          </button>
          <button onClick={() => navigate("/signup")}>
            Don't have an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;