import { useEffect, useState, useContext } from "react";
import { getUserSettings, deleteUserSettings, changeUserPassword, GetModule, GetAllProgressTracker, downloadCompletedTask , fetchCompletedInteractiveContent} from "../services/api";
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

  useEffect(() => {
    async function loadCompletedTasks() {
      try {
        const data = await fetchCompletedInteractiveContent();
        setCompletedCourses(data);
      } catch (err) {
        console.error("Failed to fetch completed interactive content", err);
      }
    }
  
    loadCompletedTasks();
  }, []);
  


const handleDownload = async(taskId) => {
  if(!token){
    alert("user isnt authenticated");
    return;
  }
  try{
    await downloadCompletedTask(taskId, token);

  }
  catch (error) {
    try {
      const errorBlob = error.response?.data;
      const errorText = await errorBlob.text(); 
      const errorJson = JSON.parse(errorText);  
  
      if (
        error.response?.status === 400 &&
        errorJson?.error === "No questions found for this task"
      ) {
        alert("This task has no questions and cannot be downloaded as a PDF.");
      } else {
        alert("Error downloading PDF");
      }
    } catch (parseError) {
      alert("Error downloading PDF");
      console.error("Unhandled error:", parseError);
    }
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
    await deleteUserSettings();
    
      alert("Account deleted successfully. A confirmation email has been sent to your registered email.");
      
      updateUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/signup");
    // } else {
    //   alert("Failed to delete account. Please try again.");
    // }
  } 
  catch (error) {
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
      {completedCourses.length > 0 ? (
    <div className="completed-courses-container">
      {completedCourses.map((task, index) => (
        <div key={index} className="course-card">
          <h3>{task.title}</h3> <br />
          <p><strong>Type:</strong> {task.quiz_type} </p>
          <p><strong>Completed on:</strong> {new Date(task.viewed_at).toLocaleString()}</p>
          {/* Download button */}
          <button onClick={() => handleDownload(task.content_id)}>
            Download PDF
          </button>
        </div>
      ))}
    </div>
  ) : (
    <p>No completed content yet.</p>
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
  