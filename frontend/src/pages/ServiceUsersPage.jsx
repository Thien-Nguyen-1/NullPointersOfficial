import React, { useEffect, useState } from "react";
import { fetchServiceUsers, deleteServiceUser } from "../services/api";
import { FaTrash } from "react-icons/fa";

const ServiceUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const getUsers = async () => {
            try {
                const data = await fetchServiceUsers();
                setUsers(Array.isArray(data) ? data : []);
                setFilteredUsers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        getUsers();
    }, []);

    // Filter users based on search input
    useEffect(() => {
        const filtered = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const handleDelete = async (username) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${username}?`);
        if (!confirmDelete) return;

        try {
            await deleteServiceUser(username);
            setUsers(users.filter(user => user.username !== username));
            setFilteredUsers(filteredUsers.filter(user => user.username !== username));
            setSuccessMessage(`User with username "${username}" has been deleted.`);
        } catch (err) {
            console.error("Error deleting user:", err);
            setError("Failed to delete user.");
        }
    };


    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    if (users.length === 0) {
        return <p>No service users registered yet.</p>;
    }

    return (
        <div>
            <h2>Service Users</h2>

            {successMessage && (
                <div style={{ background: "#d4edda", color: "#155724", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
                    {successMessage} <button onClick={() => setSuccessMessage("")} style={{ marginLeft: "10px", cursor: "pointer" }}>✖</button>
                </div>
            )}

            <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
            />

            {filteredUsers.length === 0 ? (
                <p>All {users.length} records of service users searched : None found with username "{searchQuery}"</p>
            ) : (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Tags</th>
                            <th>Delete Account</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.user_id}>
                                <td>{user.username}</td>
                                <td>{user.first_name}</td>
                                <td>{user.last_name}</td>
                                <td>{user.tags?.join(" | ") || "No tags"}</td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(user.username)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "red" }}
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ServiceUsersPage;
