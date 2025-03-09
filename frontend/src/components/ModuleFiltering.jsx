import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
// import "../styles/Courses.css";
import "../styles/ModuleFiltering.css";

const ModuleFiltering = ({ handleSort, currentSortOption }) => {
    return (
        <>
            {/* Sort options */}
            {<div className="sort-container">
                <div 
                    className={`sort-option ${currentSortOption === 'newest' ? 'active' : ''}`}
                    onClick={() => handleSort('newest')}
                >
                    Recently Added
                </div>
                <div 
                    className={`sort-option ${currentSortOption === 'oldest' ? 'active' : ''}`}
                    onClick={() => handleSort('oldest')}
                >
                    Oldest Courses
                </div>
                <div 
                    className={`sort-option ${currentSortOption === 'title' ? 'active' : ''}`}
                    onClick={() => handleSort('title')}
                >
                    By Title
                </div>
            </div>}
        </>
    )
};


export default ModuleFiltering;
