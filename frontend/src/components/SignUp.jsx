import React, { useState } from 'react';
import { SignUpUser } from "../services/api";
import '../styles/Signup.css';

const Signup = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("service user");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async(e) => {
    e.preventDefault();
    try {
      const data = await SignUpUser(username, firstName, lastName, userType, password, confirmPassword);
      console.log("Sign Up successful:", data);
      alert("Sign up worked " + username);
    } catch(err) {
      setError(err.message);
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <div className="signup-header">
          <div className="signup-text">Sign Up</div>
          <div className="signup-underline"></div>
        </div>
        
        <form onSubmit={handleSignUp} className="signup-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="signup-input"
          />
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="signup-input"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="signup-input"
          />
          <select 
            value={userType} 
            onChange={(e) => setUserType(e.target.value)}
            className="signup-select"
          >
            <option value="service user">Service User</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="signup-input"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            className="signup-input"
          />
          <button type="submit" className="signup-button">Sign Up</button>
        </form>
        
        {error && <p className="signup-error">{error}</p>}
      </div>
    </div>
  );
};

export default Signup;