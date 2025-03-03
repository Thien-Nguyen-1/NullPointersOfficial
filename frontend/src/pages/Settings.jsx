import { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSettings, deleteAdminSettings, changeAdminPassword } from "../services/api";
import { useNavigate } from "react-router-dom";


function Settings() {

  const [showModal, setShowModal] = useState (false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] =  useState ({
    first_name: "",
    last_name: "",
    username: "",
  });
  const [passwordData,setPasswordData] = useState ({
    old_password: "",
    new_password: "",
    confirm_new_password: "" 
  });  

  useEffect(() => {
    async function fetchSettings () {
      try {
        const userData = await getAdminSettings();
        setUser(userData);
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name|| "",
          username: userData.username || "",
        });
      }
      catch(error) {
        console.error ("Error fetching user settings", error);
      }
    }
    fetchSettings();
  },
  []
);

const handleUpdate = async() => {
  try {
    await updateAdminSettings(formData);
    alert("Account updated successfully.");
  }
  catch (erorr){
    alert("Failed to update account");
  }
};

const handlePasswordChange = async() => {
  try {
    await changeAdminPassword(
      passwordData.old_password,
      passwordData.new_password,
      passwordData.confirm_new_password
    );
    alert("Password updated successfully.");
    setPasswordData({old_password: "", new_password:"", confirm_new_password:""});

  }
  catch (erorr){
    alert("Failed to chnage password");
  }
};

const handleDelete = async() => {
  try {
    await deleteAdminSettings();
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

    {/* ✅ Profile Update Section */}
    {user ? (
      <div>
        <p className="mt-2 text-gray-600">Welcome, {user.first_name} {user.last_name}</p>
        <p className="mt-2 text-gray-600">User ID: {user.user_id}</p>

        <div className="mt-4">
          <label>First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <div className="mt-4">
          <label>Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <div className="mt-4">
          <label>Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <button onClick={handleUpdate} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Save Changes
        </button>
      </div>
    ) : (
      <p>Loading...</p>
    )}

    {/* ✅ Change Password Section */}
    <div className="mt-6">
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

    {/* ✅ Delete Account Button */}
    <button onClick={() => setShowModal(true)} className="mt-6 px-4 py-2 bg-red-600 text-white rounded">
      Delete Account
    </button>

    {/* ✅ Confirmation Modal for Deletion */}
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
  