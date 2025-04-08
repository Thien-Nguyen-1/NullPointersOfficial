import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../services/AuthContext";

const RequestPasswordReset = () => { 
    const [email,setEmail] = useState("");
    const {RequestPasswordReset} =useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleResetRequest = async(e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            const response = await RequestPasswordReset(email);
            setMessage(response.message);
            alert("A password reset link has been sent to your email. Please check your inbox and spaam folder.");
        }
        catch (error){
            console.error("Error:", error);
            setError("Please enter the valid email address you used to register with.");
            alert("Please enter the valid email address you used to register with.");
        }
    };




    return (
        <div className = "changepassword-container">
        <div className = "changepassword-box">
            <h4>Please input your email</h4>
            <form onSubmit={handleResetRequest} style={{width: '100%'}}>
            <input
                type ="text"
                value ={ email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <button type ="submit">Confirm</button>
            </form>
            <div className="reset-links">
                <button onClick={() => navigate("/")}> Back </button>
            </div>
        </div>

        </div>
    );
};


export default RequestPasswordReset;