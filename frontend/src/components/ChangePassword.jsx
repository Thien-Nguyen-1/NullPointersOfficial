import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResetPassword } from "../services/api";
import '../styles/ChangePassword.css';

const ChangePassword = () => {

    const [username,setUsername] = useState("");
    const [newPassword,setNewPassword] = useState("");
    const [confirmNewPassword,setConfirmNewPassword] = useState("");
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleChangePassword = async(e) => {
            e.preventDefault();
            try{
                const data = await ResetPassword(username, newPassword, confirmNewPassword);
                console.log("Password reset succesful:" , data)
                alert("Password reset worked" + username)
                
            }
            catch(err){
                setError("Invalid password reset");
            }
        }

    return (
        <div className = "changepassword-container">
        <div className = "changepassword-box">
            <h4>Change password page</h4>
        <form onSubmit={handleChangePassword}>
            <input
                type ="text"
                value ={ username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
            />
            <input 
                type ="password"
                value = {newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=" New Password"
                required
            />
            <input 
                type ="password"
                value = {confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder=" Confirm New Password"
                required
            />
            <button type ="submit">Reset Password</button>
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

export default ChangePassword;