import { useState } from "react";
import {SignUpUser} from "../services/api";
import { useNavigate } from "react-router-dom";


const Signup = () => {

    const [username,setUsername] = useState("");
    const [firstName,setFirstName] = useState("");
    const [lastName,setLastName] = useState("");
    const [userType,setUserType] = useState("");
    const [password,setPassword] = useState("");
    const [confirmPassword,setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignUp = async(e) => {
        e.preventDefault();

        
        try{
            const data = await SignUpUser(username,firstName,lastName,userType, password, confirmPassword);
            console.log("Sign Up succesful:" , data)
            alert("Sign up worked " + username)
            
        }
        catch(err){
            setError(err.message);
            

        }
    }



  return (
    <div className = 'conatiner'>
        <div className = "header">
            <div className ="text">Sign Up page</div>
            <div className ="underline"></div>
        </div>
        <form onSubmit={handleSignUp}>
            <input
                type ="text"
                placeholder ="Username"
                value = {username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type ="text"
                placeholder ="First Name"
                value = {firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
            />
            <input
                type ="text"
                placeholder ="Last Name"
                value = {lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
            />
            <select value={userType} onChange = {(e) => setUserType(e.target.value)}>
                <option value= ""diables> Select user type</option>
                <option value= "admin"> Admin</option>
                <option value= "service user"> Service user</option>
            </select>
            <input 
                type ="password"
                value = {password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <input 
                type ="password"
                value = {confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
            />
            <button type ="submit">Sign Up</button>
        </form>
        {error && <p className="error">{error}</p>}
        <button  onClick={() => navigate("/login")}>
          Login
        </button>
    </div>
 
  );
};

export default Signup;
