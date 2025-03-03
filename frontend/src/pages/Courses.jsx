import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/Courses.css";

function Courses({ role }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tags, setTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);
    const [sortOption, setSortOption] = useState("newest"); // Default sort: newest first

    // Fetch all modules/courses when component mounts
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/modules/');
                
                // Sort courses by created_at or id (newest first)
                const sortedCourses = response.data.sort((a, b) => {
                    // If created_at is available, use it
                    if (a.created_at && b.created_at) {
                        return new Date(b.created_at) - new Date(a.created_at);
                    }
                    // Otherwise sort by ID (assuming higher ID means newer)
                    return b.id - a.id;
                });
                
                setCourses(sortedCourses);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError("Failed to load courses. Please try again later.");
                setLoading(false);
            }
        };

        const fetchTags = async () => {
            try {
                const response = await api.get('/api/tags/');
                setTags(response.data);
            } catch (err) {
                console.error("Error fetching tags:", err);
            }
        };

        fetchCourses();
        fetchTags();
    }, []);

    // Handle sort change
    const handleSortChange = (option) => {
        setSortOption(option);
        
        // Sort courses based on the selected option
        const sortedCourses = [...courses].sort((a, b) => {
            if (option === "newest") {
                // Sort by created_at or id (newest first)
                if (a.created_at && b.created_at) {
                    return new Date(b.created_at) - new Date(a.created_at);
                }
                return b.id - a.id;
            } else if (option === "oldest") {
                // Sort by created_at or id (oldest first)
                if (a.created_at && b.created_at) {
                    return new Date(a.created_at) - new Date(b.created_at);
                }
                return a.id - b.id;
            } else if (option === "title") {
                // Sort alphabetically by title
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
        
        setCourses(sortedCourses);
    };

    // Filter courses by selected tag
    const filteredCourses = selectedTag 
        ? courses.filter(course => course.tags && course.tags.includes(selectedTag)) 
        : courses;

    return (
        <div>
            <h1 className="page-title">Courses</h1>
            
            {/* Show the "Create Module" button only if the user is an Admin */}
            {role === "admin" && (
                <div className="admin-actions">
                    <Link to="/admin/courses/create-and-manage-module" className="create-module-btn">
                        Create Module
                    </Link>
                </div>
            )}

            {/* Filter and Sort Controls */}
            <div className="controls-row">
                {/* Tag filter */}
                {tags.length > 0 && (
                    <div className="filter-section">
                        <div className="filter-label">Filter by tag:</div>
                        <div className="tags-list">
                            <button 
                                className={`tag-btn ${selectedTag === null ? 'active' : ''}`}
                                onClick={() => setSelectedTag(null)}
                            >
                                All
                            </button>
                            {tags.map(tag => (
                                <button 
                                    key={tag.id}
                                    className={`tag-btn ${selectedTag === tag.id ? 'active' : ''}`}
                                    onClick={() => setSelectedTag(tag.id)}
                                >
                                    {tag.tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Sort options */}
                <div className="sort-section">
                    <div className="sort-label">Sort by:</div>
                    <div className="sort-options">
                        <button 
                            className={`sort-btn ${sortOption === 'newest' ? 'active' : ''}`}
                            onClick={() => handleSortChange('newest')}
                        >
                            Newest
                        </button>
                        <button 
                            className={`sort-btn ${sortOption === 'oldest' ? 'active' : ''}`}
                            onClick={() => handleSortChange('oldest')}
                        >
                            Oldest
                        </button>
                        <button 
                            className={`sort-btn ${sortOption === 'title' ? 'active' : ''}`}
                            onClick={() => handleSortChange('title')}
                        >
                            Title
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="loading-state">
                    <p>Loading courses...</p>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="error-state">
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="retry-btn"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredCourses.length === 0 && (
                <div className="empty-state">
                    <p className="mt-2 text-gray-600">
                        {selectedTag ? "No courses found for the selected tag." : "No courses available yet."}
                    </p>
                </div>
            )}

            {/* Course cards container */}
            {!loading && !error && filteredCourses.length > 0 && (
                <div className="courses-container">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="course-card">
                            <div className="course-card-header">
                                <h3 className="course-title">{course.title}</h3>
                                {course.pinned && (
                                    <span className="pinned-badge" title="Pinned course">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L8 6H4v4l4 4-6 6 6-6 4 4v4h4l4-4-4-4 6-6-6 6-4-4V6z"></path>
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <p className="course-description">{course.description || "No description available."}</p>
                            <div className="course-tags">
                                {course.tags && course.tags.length > 0 ? course.tags.map(tagId => {
                                    const tagObject = tags.find(t => t.id === tagId);
                                    return tagObject ? (
                                        <span key={tagId} className="course-tag">
                                            {tagObject.tag}
                                        </span>
                                    ) : null;
                                }) : (
                                    <span className="no-tags">No tags</span>
                                )}
                            </div>
                            <div className="course-actions">
                                <Link 
                                    to={`/${role}/courses/${course.id}`} 
                                    className="view-course-btn"
                                >
                                    View Course
                                </Link>
                                {role === "admin" && (
                                    <Link 
                                        to="/admin/courses/create-and-manage-module"
                                        className="edit-course-btn"
                                    >
                                        Edit
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
    
export default Courses;