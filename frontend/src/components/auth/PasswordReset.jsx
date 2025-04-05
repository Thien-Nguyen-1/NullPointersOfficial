import { useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
//import { ResetPassword } from "../services/api";
import '../../styles/PasswordReset.css';

import { AuthContext } from "../../services/AuthContext";

const PasswordReset = () => {

    const [newPassword,setNewPassword] = useState("");
    const [confirmNewPassword,setConfirmNewPassword] = useState("");
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const {uidb64, token} = useParams();

    const {ResetPassword} = useContext(AuthContext) 


    const handlePasswordReset = async(e) => {
            e.preventDefault();
            // setMessage("");
            try{
                const data = await ResetPassword(newPassword, confirmNewPassword, uidb64, token);
                console.log("Password reset succesful:" , data);
                alert("Password reset worked" );
                
            }
            catch(err){
                setError("Invalid password reset");
            }
        }

    return (
        <div className = "changepassword-container">
        <div className = "changepassword-box">
            <h4>Reset your password</h4>
        <form onSubmit={handlePasswordReset}>
            <input 
                type ="password"
                value = {newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
            />
            <input 
                type ="password"
                value = {confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
            />
            <button type ="submit">Confirm</button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="changepassword-links">
        <button  onClick={() => navigate("/")}>
          Back
        </button>
        <button  onClick={() => navigate("/login")}>
          Login
        </button>
    </div>
    </div>
    </div>

    );
};

export default PasswordReset;