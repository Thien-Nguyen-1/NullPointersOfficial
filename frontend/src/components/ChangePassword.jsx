import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResetPassword } from "../services/api";

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
        <div className = "container">
        <div className = "header">
            <div className ="text">Change password page</div>
            <div className ="underline"></div>
        </div>
        <form onSubmit={handleChangePassword}>
            <input
                type ="text"
                value ={ username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
            />
            <input 
                type ="text"
                value = {newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=" New Password"
                required
            />
            <input 
                type ="text"
                value = {confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder=" Confirm New Password"
                required
            />
            <button type ="submit">Reset Password</button>
        </form>
        {error && <p className="error">{error}</p>}
        <button  onClick={() => navigate("/")}>
          Back
        </button>
        <button  onClick={() => navigate("/login")}>
          Login
        </button>
    </div>

    );
};

export default ChangePassword;