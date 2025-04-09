import React from "react";
import { useRef, useState, useEffect } from "react"; 
import styles from "../styles/CoursesTagList.module.css";
import { GrAdd } from "react-icons/gr";

const CourseTagsList = ({tags = [], selectedTag, setSelectedTag, isUser}) => {
    const scrollRef = useRef();
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false); 

    // Check if overflow exists
    const checkOverflow = () => {
        const el = scrollRef.current;
        if (!el) return;
        setShowLeftArrow(el.scrollLeft > 0);
        setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
      
        const handleScroll = () => {
          checkOverflow();
        };
      
        checkOverflow();
        el.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleScroll);
      
        return () => {
          el.removeEventListener("scroll", handleScroll);
          window.removeEventListener("resize", handleScroll);
        };
      }, [tags]);
    
    const scrollByAmount = 150;
    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -scrollByAmount, behavior: "smooth" });
            requestAnimationFrame(checkOverflow);
        }
    };
    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: scrollByAmount, behavior: "smooth" });
            requestAnimationFrame(checkOverflow);
        }
    };


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
                    
                    <div 
                        className={styles["tags-scroll-wrapper"]}
                        >
                        
                        {showLeftArrow && (
                            <div className={`${styles["scroll-arrow-container"]} ${styles["left"]}`}>
                                <div className={styles["fade-left"]}></div>
                                <button onClick={scrollLeft} className={styles["scroll-arrow"]}>
                                &lt;
                                </button>
                            </div>
                                
                        )}

                        
                        <div className={styles["tags-list-wrapper"]}>
                            <div className={styles["tags-list"]} ref={scrollRef}>
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

                        {showRightArrow && (
                            <div className={`${styles["scroll-arrow-container"]} ${styles["right"]}`}>
                                <div className={styles["fade-right"]}></div>
                                <button onClick={scrollRight} className={styles["scroll-arrow"]}>
                                &gt;
                                </button>
                            </div>
                        )}
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

