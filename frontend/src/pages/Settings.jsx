import { useEffect, useState, useContext } from "react";
import { deleteUserSettings, changeUserPassword, downloadCompletedTask , fetchCompletedInteractiveContent} from "../services/api";
import { useNavigate } from "react-router-dom";
import '../styles/Settings.css';
import {AuthContext} from "../services/AuthContext";

function Settings() {
  const {user, updateUser}= useContext(AuthContext);
  const [showModal, setShowModal] = useState (false);
  const navigate = useNavigate();
  const [completedCourses, setCompletedCourses] = useState([]);
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
        console.log("Fetched completed content:", data);

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
        alert("This task has no questions/answers and cannot be downloaded as a PDF.");
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
      localStorage.removeItem("refreshToken");

      navigate("/signup");
  } 
  catch (error) {
    alert("Failed to delete account.");
  }
};

function renderUserInfo() {
  return (
    <div className="settings-card user-info-card">
      <h1>Welcome {user?.first_name} {user?.last_name}</h1>
      <p className="mt-2 text-gray-600">Username: {user?.username}</p>
    </div>
  );
}

function renderCompletedCourses() {
  return (
    <div className="settings-card centre">
      <h2>Completed Courses</h2>
      {completedCourses.length > 0 ? (
        <div className="completed-courses-container">
          {completedCourses.map((task, index) => (
            <div key={index} className="course-card">
              <h3>{task.title}</h3>
              <p><strong>Type:</strong> {task.quiz_type}</p>
              <p><strong>Completed on:</strong> {new Date(task.viewed_at).toLocaleString()}</p>
              <button onClick={() => handleDownload(task.content_id)}>Download PDF</button>
            </div>
          ))}
        </div>
      ) : (
        <p>No completed content yet.</p>
      )}
    </div>
  );
}

function renderPasswordForm() {
  const userClass =
  user?.user_type === "service user"
    ? "settings-card centre"
    : "settings-card"; 
  return (
    <div className={userClass} >    
      <h2>Change Password</h2>

      <label>Old Password</label>
      <input type="password" value={passwordData.old_password}
        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })} />

      <label>New Password</label>
      <input type="password" value={passwordData.new_password}
        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} />

      <label>Confirm New Password</label>
      <input type="password" value={passwordData.confirm_new_password}
        onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })} />

      <button onClick={handlePasswordChange}>Confirm Change</button>

    </div>
  );
}

return (
  <div className="settings-container">
    <h1 className="page-title">Settings</h1>

    {user?.user_type === "service user" ? (
      <>
        <div className="service-user-stack">
          <div className="card-row welcome-card service-welcome">
            {renderUserInfo()}
          </div>

          <div className="settings-layout">
            {renderCompletedCourses()}
            {renderPasswordForm(user?.user_type)}
          </div>

            <button className="delete-btn" onClick={() => setShowModal(true)}>
              Delete Account
            </button>
        </div>
      </>
    ) : (
      <>
        <div className="card-row welcome-card">
          {renderUserInfo()}
        </div>

        <div className="admin-stack">
          <div>{renderPasswordForm(user?.user_type)}</div>
          <div className="card delete-card">
            <button className="delete-btn" onClick={() => setShowModal(true)}>
              Delete Account
            </button>
        </div>
        </div>
      </>
    )}

    {showModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h1>Confirm Deletion</h1>
          <p>This action cannot be undone.</p>
          <div className="modal-buttons">
            <button onClick={() => setShowModal(false)}>Cancel</button>
            <button onClick={handleDelete}>Confirm Delete</button>
          </div>
        </div>
      </div>
    )}
  </div>
  
);

}

export default Settings;