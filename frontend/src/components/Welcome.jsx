import React from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1 >Welcome to Our Platform</h1>
      <p >Please sign up or log in to continue.</p>
      
      <div>
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