import { useEffect, useState, useContext } from "react";
import { getUserSettings, deleteUserSettings, changeUserPassword, GetModule, GetAllProgressTracker, downloadCompletedTask } from "../services/api";
import { useNavigate } from "react-router-dom";
import '../styles/Settings.css';
import {AuthContext} from "../services/AuthContext";

function Settings() {
  const {user, updateUser}= useContext(AuthContext);
  const [showModal, setShowModal] = useState (false);
  const navigate = useNavigate();
  // const [user, setUser] = useState({});
  const [completedCourses, setCompletedCourses] = useState([]);
  const [taskId, setTaskId] = useState("");
  const token = localStorage.getItem("token");

  const [passwordData,setPasswordData] = useState ({
    old_password: "",
    new_password: "",
    confirm_new_password: "" 
  }); 

// useEffect(() => {
//   async function fetchCompletedCourses() {
//     if (!user || !user.id) {
//       console.warn("User is not available.");
//       return;
//     }

//     try {
//       const allModules = await GetModule();
//       const progressData = await GetAllProgressTracker(); 

//       if (allModules && progressData) {
//         const completed = progressData
//           .filter(tracker => tracker.user === user.id && tracker.completed)
//           .map(tracker => {
//             const foundModule = allModules.find(mod => mod.id === tracker.module);
//             if (!foundModule) {
//             }
//             return foundModule ? { ...foundModule, progressId: tracker.id } : null;
//           })
//           .filter(Boolean); 
//         setCompletedCourses(completed);
//       }
//     } catch (error) {
//       console.error("Error fetching completed courses:", error);
//     }
//   }

//   fetchCompletedCourses();
// }, [user]);


const handleDownload = async(taskId) => {
  if(token){
    alert("user isnt authenticated");
    return;
  }
  try{
    await downloadCompletedTask(taskId, token);

  }
  catch(error){
    alert("Error downloading pdf");
  }
};


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
      passwordData.old_password,
      passwordData.new_password,
      passwordData.confirm_new_password
    );
    alert("Password updated successfully.");
    setPasswordData({old_password: "", new_password:"", confirm_new_password:""});

  }
  catch (erorr){
      alert("Failed to change password, please try again.");

  }
};

const handleDelete = async () => {
  if (!user) {
    alert("User data not loaded");
    return;
  }
  try {
    const response = await deleteUserSettings();
    if (response) {
      alert("Account deleted successfully.");
      
      updateUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/signup");
    } else {
      alert("Failed to delete account. Please try again.");
    }
  } catch (error) {
    alert("Failed to delete account.");
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
    {user?.user_type === "service user" && (
      <div className="settings-card">
      <h1>Completed Courses</h1>
      {/* {completedCourses.length > 0 ? (
        <ul>
          {completedCourses.map((module, index) => (
            <li key={index}>
              {module.title}
              <button onClick={() => handleDownload(module.id)} className="download-button">
                    Download PDF
                </button>
              </li>
          ))}
        </ul>
      ) : (
        <p>No completed courses yet.</p>
      )} */}
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
  