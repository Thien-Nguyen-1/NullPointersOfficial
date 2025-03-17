import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const VerifyEmail = () => {
  const { token } = useParams();  
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/verify-email/${token}/`);
        const data = await response.json();

        if (response.ok) {
          setMessage("Email verified successfully! Redirecting...");
          setTimeout(() => navigate("/login"), 3000);  
        } else {
          setMessage(data.error || "Invalid or expired verification link.");
        }
      } catch (error) {
        setMessage("An error occurred. Please try again.");
      }
    };

    verifyUserEmail();
  }, [token, navigate]);

  return (
    <div>
      <h2>Email Verification</h2>
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;
