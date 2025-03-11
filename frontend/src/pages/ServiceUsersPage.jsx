import "../styles/ServiceUsersPage.css"
import React, { useEffect, useState } from "react";
import { fetchServiceUsers, deleteServiceUser } from "../services/api";
import { FaTrash, FaSearch, FaTimes } from "react-icons/fa";

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

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
        </div>
    );
    
    if (error) return (
        <div className="error-container">
            <p>Error: {error}</p>
        </div>
    );

    if (users.length === 0) {
        return (
            <div className="empty-state">
                <p>No service users registered yet.</p>
            </div>
        );
    }

    return (
        <div className="users-page">
            <h1 className="page-title">Service User Directory</h1>

            {successMessage && (
                <div className="success-message">
                    {successMessage}
                    <button 
                        onClick={() => setSuccessMessage("")} 
                        className="close-button"
                        aria-label="Close notification"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <div className="search-container">
                <div className="search-input-wrapper">
                    <div className="search-icon-container">
                        <FaSearch size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                        autoComplete="off"
                    />
                    {searchQuery && (
                        <div className="clear-button-container">
                            <button 
                                onClick={() => setSearchQuery("")} 
                                className="clear-search"
                                aria-label="Clear search"
                                type="button"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="no-results">
                    <p>All {users.length} records of service users searched: None found with username "{searchQuery}"</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Tags</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.user_id}>
                                    <td>{user.username}</td>
                                    <td>{user.first_name}</td>
                                    <td>{user.last_name}</td>
                                    <td>
                                        <div className="users-tags-container">
                                            {user.tags && user.tags.length > 0 ? 
                                                user.tags.map((tag, index) => (
                                                    <span key={index} className="tag">{tag}</span>
                                                )) : 
                                                <span className="no-tags">No tags</span>
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(user.username)}
                                            className="delete-button"
                                            aria-label={`Delete user ${user.username}`}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ServiceUsersPage;