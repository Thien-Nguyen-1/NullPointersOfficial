import React from "react";
import styles from "../styles/CoursesTagList.module.css";
import { GrAdd } from "react-icons/gr";

const CourseTagsList = ({tags = [], selectedTag, setSelectedTag, isUser}) => {


    return (
        <>
            <h2 className={styles.subheading}>Tags</h2>
    
            {tags.length > 0 ? (
                <div className={styles["filter-section"]}>
                    <div className={styles["filter-label"]}>
                        {isUser ? (
                            tags.length == 1 ?
                            <>You have <strong>{tags.length}</strong> tag</> :
                            <>You have <strong>{tags.length}</strong> tags</>
                        ) : (
                            tags.length == 1 ?
                                <>There is <strong>{tags.length}</strong> tag created</> :
                                <>There are <strong>{tags.length}</strong> tags created</>
                            )
                        }
                    </div>
                    <div className={styles["tags-list"]}>
                        <button 
                            className={`${styles["tag-btn"]} ${selectedTag === null ? styles["active"] : ''}`}
                            onClick={() => setSelectedTag(null)}
                        >
                            All
                        </button>
                        {tags.map(tag => (
                            <button 
                                key={tag.id || tag.tag}
                                className={`${styles["tag-btn"]} ${selectedTag === tag.id ? styles["active"] : ''}`}
                                onClick={() => setSelectedTag(tag.id)}
                            >
                                {tag.tag}
                            </button>
                        ))}
                        {!isUser && 
                        <div className={`${styles["tag-btn"]} ${styles.editButton}`} data-testid="edit-button" onClick={(e) => {}}> 
                            <GrAdd />
                        </div>}
                    </div>
                </div>
            ) : (
                <div className={styles["filter-label"]}>
                    {isUser ? (
                        <>You have <strong>{tags.length}</strong> tags</>
                    ) : (
                        <>There are <strong>{tags.length}</strong> tags created</>
                    )}
                    
                </div>
            )}
        </>
    );
}





export default CourseTagsList

