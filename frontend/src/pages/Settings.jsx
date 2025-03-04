import { useEffect, useState } from "react";
import { getUserSettings, deleteUserSettings, changeUserPassword } from "../services/api";
import { useNavigate } from "react-router-dom";


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
  <div>
    <h1 className="page-title">Settings</h1>
   <div>
        <p className="mt-2 text-gray-600">Welcome, {user.first_name} {user.last_name}</p>
        <p className="mt-2 text-gray-600">User ID: {user.user_id}</p>
    </div>
    {user.user_type === "service user" && (
      <div className="download-container">
        <h2>Download section for service users</h2>
      </div>
    )}
    <div className="change-password">
      <h2 className="text-lg font-bold">Change Password</h2>

      <div className="mt-2">
        <label>Old Password</label>
        <input
          type="password"
          value={passwordData.old_password}
          onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
          className="border p-2 w-full"
        />
      </div>

      <div className="mt-2">
        <label>New Password</label>
        <input
          type="password"
          value={passwordData.new_password}
          onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
          className="border p-2 w-full"
        />
      </div>

      <div className="mt-2">
        <label>Confirm New Password</label>
        <input
          type="password"
          value={passwordData.confirm_new_password}
          onChange={(e) => setPasswordData({ ...passwordData, confirm_new_password: e.target.value })}
          className="border p-2 w-full"
        />
      </div>

      <button onClick={handlePasswordChange} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">
        Change Password
      </button>
    </div>

    <button onClick={() => setShowModal(true)} className="mt-6 px-4 py-2 bg-red-600 text-white rounded">
      Delete Account
    </button>

    {showModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold">Confirm Deletion</h2>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div className="mt-4 flex justify-end">
            <button className="mr-2 px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

  
export default Settings;
  