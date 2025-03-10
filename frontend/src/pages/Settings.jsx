import { useEffect, useState, useContext } from "react";
import { getUserSettings, deleteUserSettings, changeUserPassword, GetModule, GetAllProgressTracker } from "../services/api";
import { useNavigate } from "react-router-dom";
import '../styles/Settings.css';
import {AuthContext} from "../services/AuthContext";

function Settings() {
  const {user, updateUser}= useContext(AuthContext);
  const [showModal, setShowModal] = useState (false);
  const navigate = useNavigate();
  // const [user, setUser] = useState({});
  const [completedCourses, setCompletedCourses] = useState([]);

  const [passwordData,setPasswordData] = useState ({
    old_password: "",
    new_password: "",
    confirm_new_password: "" 
  }); 
  
  if(!user){
    return<div className="loading">Loading user data...</div>;
  }

//   useEffect(() => {
//     async function fetchSettings () {
//       try {
//         const userData = await getUserSettings();
//         console.log("Fetched user data in settings:", userData)
//         setUser(userData);
//         console.log("User Data:", user);

//       }
//       catch(error) {
//         console.error ("Error fetching user settings", error);
//       }
//     }
//     fetchSettings();
//   },
//   []
// );

useEffect(() => {
  async function fetchCompletedCourses() {
    if (!user) return;

    try {
      // Fetch all modules
      const allModules = await GetModule();
      // Fetch user's progress tracker
      const progressData = await GetAllProgressTracker();

      if (allModules && progressData) {
        // Filter completed courses
        const completed = progressData
          .filter((tracker) => tracker.user === user.id && tracker.completed)
          .map((tracker) => allModules.find((mod) => mod.id === tracker.module))
          .filter(Boolean); // Remove undefined values

        setCompletedCourses(completed);
      }
    } catch (error) {
      console.error("Error fetching completed courses:", error);
    }
  }

  fetchCompletedCourses();
}, [user]);


const handlePasswordChange = async() => {
  if(passwordData.new_password !== passwordData.confirm_new_password){
    alert("New passwords do not match. Please re-enter them.")
    return;
  }

  if(!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_new_password){
    alert("All fields are required.")
    return;
  }

  try {
    await changeUserPassword(
      {old_password:passwordData.old_password,
      new_password:passwordData.new_password
      }
    );
    alert("Password updated successfully.");
    setPasswordData({old_password: "", new_password:"", confirm_new_password:""});

  }
  catch (erorr){
      alert("Failed to change password, please try again.");
  
  }
};

const handleDelete = async() => {
  try {
    await deleteUserSettings();
    alert("Account deleted successfully.");
    navigate("/signup");
  }
  catch (erorr){
    alert("Failed to delete account");
  }
};

return (
  <div className="settings-container">
  <div>
    <h1 className="page-title">Settings</h1>
   <div className = "settings-card">
        <h1>Welcome, {user?.first_name} {user?.last_name}</h1>
        <p className="mt-2 text-gray-600">Username: {user?.username}</p>
    </div>
    {user.user_type === "service user" && (
      <div className="settings-card">
      <h1>Completed Courses</h1>
      {completedCourses.length > 0 ? (
        <ul>
          {completedCourses.map((course, index) => (
            <li key={index}>{course.title}</li>
          ))}
        </ul>
      ) : (
        <p>No completed courses yet.</p>
      )}
    </div>
    
    )}
    <div className="settings-card">
      <h1>Change Password</h1>

      <div>
        <label htmlFor="old_password">Old Password:   </label>
        <input
          id = "old_password"
          type="password"
          // placeholder="Old Password"
          value={passwordData.old_password}
          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="new_password">New Password:   </label>
        <input
          id = "new_password"
          type="password"
          // placeholder="New Password"
          value={passwordData.new_password}
          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
        />
      </div>

      <div className="extra-space">
        <label htmlFor="confirm_new_password">Confirm New Password:   </label>
        <input
          id = "confirm_new_password"
          type="password"
          // placeholder="Confirm New Password"
          value={passwordData.confirm_new_password}
          onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
        />
      </div>

      <button onClick={handlePasswordChange}>
        Confirm change
      </button>
    </div>

    <div className="delete-container">
    <button onClick={() => setShowModal(true)} >
      Delete Account
    </button>
    </div>

    {showModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h1>Confirm Deletion</h1>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div className="modal-buttons">
            <button onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button  onClick={handleDelete}>
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  </div>
);
}

  
export default Settings;
  