import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import '../../styles/Signup.css';

const VerifyEmail = () => {
  const { token } = useParams();  
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");
  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const response = await fetch(`${baseURL}/api/verify-email/${token}/`);
        const data = await response.json();

        if (response.ok) {
          setMessage("Email verified successfully! Redirecting..."); 
          navigate("/login")
        } else {
          setMessage( "Loading log in page...");
          navigate("/login")
        }
      } catch (error) {
        setMessage("An error occurred. Please try again.");
      }
    };

    verifyUserEmail();
  }, [token, navigate]);

  return (
    <div>
      <h3>Email Verification</h3>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
