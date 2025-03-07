import { useContext, useState } from "react";
//import { SignUpUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import '../styles/Signup.css';

const Signup = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userType, setUserType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const {SignUpUser} = useContext(AuthContext)


  const navigate = useNavigate();

  const checkUsernameExists = async (username) => {
    try {
      const response = await fetch (`/api/check-username?username=${username}`);
      const data = await response.json();
      return data.exists;
    } 
    catch(err) {
      console.error("Error checking username:", err);
      return true;
    }
  };

  const handleSignUp = async(e) => {
    e.preventDefault();
    setError("");
    
    if(!username.startsWith("@")){
      setError("Username must start with '@'.")
      return;
    }
    if(username.length <= 3){
      setError("Username must be longer than 3 characters.");
      return;
    }
    if(password !== confirmPassword){
      setError("Passwords do not match.");
      return;
    }

    const usernameTaken = await checkUsernameExists(username);
    if(usernameTaken){
      setError("This username is already taken, please choose another.");
      return;
    }
    
    try{
      const data = await SignUpUser(username, firstName, lastName, userType, password, confirmPassword, email);
      console.log("Sign Up successful:", data);
      alert("Sign up worked " + username);

      navigate("/login")
    }
    catch(err){
      setError(err.message);
    }
  }
  
  return (
    <div className="signup-container">
      <div className="signup-box">
        <h3>Sign Up page</h3>

        <form onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select 
            value={userType} 
            onChange={(e) => setUserType(e.target.value)}
            required
          >
            <option value="" disabled>Select user type</option>
            <option value="admin">Admin</option>
            <option value="service user">Service user</option>
          </select>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
          <button type="submit">Sign Up</button>
        </form>

        {error && <p className="error">{error}</p>}
        <div className="signup-links">
          <button onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => navigate("/")}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default Signup;