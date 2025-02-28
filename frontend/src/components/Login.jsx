import React, { useState } from 'react';
import { loginUser, redirectBasedOnUserType } from "../services/api";
import '../styles/Login.css';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

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
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <div className="login-text">Log in</div>
          <div className="login-underline"></div>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="login-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="login-input"
          />
          <button type="submit" className="login-button">Login</button>
        </form>
        
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;