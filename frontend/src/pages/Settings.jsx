import { useEffect, useState } from "react";
import { getUserSettings, deleteUserSettings, changeUserPassword } from "../services/api";
import { useNavigate } from "react-router-dom";
import '../styles/Settings.css';

function Settings() {

  const [showModal, setShowModal] = useState (false);
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  const [passwordData,setPasswordData] = useState ({
    old_password: "",
    new_password: "",
    confirm_new_password: "" 
  });  

  useEffect(() => {
    async function fetchSettings () {
      try {
        const userData = await getUserSettings();
        console.log("Fetched user data in settings:", userData)
        setUser(userData);
        console.log("User Data:", user);

      }
      catch(error) {
        console.error ("Error fetching user settings", error);
      }
    }
    fetchSettings();
  },
  []
);

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
        <h1>Welcome, {user.first_name} {user.last_name}</h1>
        <p className="mt-2 text-gray-600">Username: {user.username}</p>
    </div>
    {user.user_type === "service user" && (
      <div className="settings-card">
        <h1>Download content</h1>
      </div>
    )}
    <div className="settings-card">
      <h1>Change Password</h1>

      <div>
        <label>Old Password:   </label>
        <input
          type="password"
          // placeholder="Old Password"
          value={passwordData.old_password}
          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
        />
      </div>

      <div>
        <label>New Password:   </label>
        <input
          type="password"
          // placeholder="New Password"
          value={passwordData.new_password}
          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
        />
      </div>

      <div className="extra-space">
        <label>Confirm New Password:   </label>
        <input
          type="password"
          // placeholder="Confirm New Password"
          value={passwordData.confirm_new_password}
          onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
        />
      </div>

      <button onClick={handlePasswordChange}>
        Change Password
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
  