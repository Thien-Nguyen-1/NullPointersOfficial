import React from "react";
import { useNavigate } from "react-router-dom";
import '../App.css';
import '../styles/Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1 >Empower</h1>
      <p >Please sign up or log in to continue.</p>
      
      <div className="button-container">
        <button  onClick={() => navigate("/signup")}>
          Sign Up
        </button>
        <button onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Welcome