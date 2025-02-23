import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {

    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    const [confirmPassword,setConfirmPassword] = useState("");

    return (
        <div className = "container">
            <div className = "header">
                <div className ="text">Change Password page</div>
                <div className ="underline"></div>
            </div>
        </div>


    );
};

export default ChangePassword;