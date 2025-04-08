import styles from "../styles/ServiceUsersPage.module.css"
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
        <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading users...</p>
        </div>
    );
    
    if (error) return (
        <div className={styles.errorContainer}>
            <p>Error: {error}</p>
        </div>
    );

    if (users.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>No service users registered yet.</p>
            </div>
        );
    }

    return (
        <div className="service-user-container">
             <h1 className="page-title">Service User Directory</h1>

            {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                    <button 
                        onClick={() => setSuccessMessage("")} 
                        className={styles.closeButton}
                        aria-label="Close notification"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <div className={styles.searchIconContainer}>
                        <FaSearch size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        autoComplete="off"
                    />
                    {searchQuery && (
                        <div className={styles.clearButtonContainer}>
                            <button 
                                onClick={() => setSearchQuery("")} 
                                className={styles.clearSearch}
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
                <div className={styles.noResults}>
                    <p>All {users.length} records of service users searched: None found with username "{searchQuery}"</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
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
                                        <div className={styles.tagsContainer}>
                                            {user.tags && user.tags.length > 0 ? 
                                                user.tags.map((tag, index) => (
                                                    <span key={index} className={styles.tag}>{tag}</span>
                                                )) : 
                                                <span className={styles.noTags}>No tags</span>
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(user.username)}
                                            className={styles.deleteButton}
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