import React, { useContext} from "react";
// import "../styles/Courses.css";
import styles from "../styles/ModuleFiltering.module.css";
import { AuthContext } from "../services/AuthContext";

const ModuleFiltering = ({ handleSort, currentSortOption }) => {
    const {user, token} = useContext(AuthContext)
    return (
        <>
            {/* Sort options */}
            {<div className={styles["sort-container"]}>
                { user?.user_type === "service user" && (
                <div 
                    className={`${styles["sort-option"]} ${styles[currentSortOption === 'Your Courses' ? 'active' : '']}`}
                    onClick={() => handleSort("Your Courses")}
                >
                    Your Courses
                </div> 
                )}
                <div 
                    className={`${styles["sort-option"]} ${styles[currentSortOption === 'All Courses' ? 'active' : '']}`}
                    onClick={() => handleSort("All Courses")}
                >
                    All Courses
                </div>
                <div 
                    className={`${styles["sort-option"]} ${styles[currentSortOption === 'Popular' ? 'active' : '']}`}
                    onClick={() => handleSort("Popular")}
                >
                    Popular
                </div>
            </div>}
        </>
    )
};


export default ModuleFiltering;
