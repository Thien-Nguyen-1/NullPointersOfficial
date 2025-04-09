import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt , MdBookmark, MdBookmarkBorder, MdOutlineUnsubscribe} from "react-icons/md";
import { AuthContext } from "../services/AuthContext";
import { useEnrollment } from "../services/EnrollmentContext";
import { tagApi } from "../services/api";
import EnrollmentModal from "./EnrollmentModal";
import styles from "../styles/CourseItem.module.css";


function CourseItem(props){

    const [tags, setTags] = useState([])
    const navigate = useNavigate();
    const module = props.module;
    const userInteractTarget  = props.userInteractTarget
    const role = props.role || "worker"; // Default to worker if role not provided


    const {user, token} = useContext(AuthContext) //to pre-load user's liked + favourite

    const userTracker = useRef(null)
    const {isEnrolled, enrollInModule} = useEnrollment(); // to check if the user has enrolled to the module 

    const [totalLikes, addLike] = useState(module.upvotes || 0)


    const [status, setStatus] = useState({
        hasLiked: false,
        hasPinned: false,
    })

    // State for the enrollment modal/popup
    const [enrollmentModal, setEnrollmentModal] = useState({
        isOpen: false,
        selectedCourse: null
    });

    const fetchTags = async () => {
        try {
            const responses = await Promise.all(
                module.tags.map(tagId => tagApi.getById(tagId))
            );
            const fetchedTags = responses.map(res => res.data);
            setTags(fetchedTags);
        } catch (err) {
            console.error("Failed to fetch tags:", err);
        }
    };


    // Handle course enrollment before client view the module
    const handleEnroll = async (courseId) => {
        try {
            // Use the context function to enroll
            await enrollInModule(courseId);

    
            // Close modal
            setEnrollmentModal({isOpen: false, selectedCourse: null});
            // To navigate to the module view
            navigate(`/modules/${courseId}`);
        } catch (err) {
            console.error("Error enrolling in course:", err);
            alert("Failed to enroll in course. Please try again later.");
        }

    };

    const handleViewCourse = (course) => {
        console.log("Current role:", role); // See what role value is being used
        console.log("User from context:", user); // Check if user has correct user_type
        console.log("Is enrolled:", isEnrolled(course.id)); // Verify enrollment status
  
        if (role === "admin" || role === "superadmin" || isEnrolled(course.id)) {
            console.log("Direct navigation condition met");
            navigate(`/modules/${course.id}`);
        } else {
            // Only users who havent enrolled could see the enrollment popup
            console.log("Showing enrollment modal");
            setEnrollmentModal({
                isOpen: true,
                selectedCourse: module
            });
        }
    };

    

    useEffect(() => {
        const run = async () => {
            await fetchTags();
            if (userInteractTarget) {
                setStatus({
                    ...status,
                    hasLiked: userInteractTarget.hasLiked,
                    hasPinned: userInteractTarget.hasPinned
                });
            }
        };
        run();
    }, [userInteractTarget]); 

    const toggleLike = () => {

        props.update_interact_module(module.id, {...status, hasLiked:!status.hasLiked})

        if(status.hasLiked){
            //totalLikes.current = totalLikes.current > 0 ? totalLikes.current -= 1 : 0
            addLike(totalLikes > 0 ? totalLikes - 1 : 0)
        } else{
            //totalLikes.current += 1
            addLike(totalLikes + 1)
        }

        setStatus({...status, hasLiked: !status.hasLiked})

    }

    const toggleFavourite = () => {

        props.update_interact_module(module.id, {...status, hasPinned:!status.hasPinned})

        setStatus({...status, hasPinned: !status.hasPinned})
      
    }

    const handleEditCourse = (course) => {
        navigate(`/admin/all-courses/create-and-manage-module?edit=${course.id}`)
    }

    return (

        <div className={styles.courseOptContainer}>
            
            <div className={styles.iconContainer}>
                <FaSearch />
            </div>
            

            <div className={styles.titleContainer}>
                <p>{module.title}</p>
            </div>

            {/* <div className={styles.likeContainer}>
                <button onClick={() => {toggleLike()}}>
                    {status.hasLiked ? <MdThumbUpAlt /> : <MdThumbUpOffAlt />}
                </button>

                <p> {totalLikes}</p>
            </div> */}

            <div className={styles["tag-container"]}>
                {tags.map(tag => (
                    <div 
                        className={styles["tag"]}
                        key={tag.id}>
                        {tag.tag}
                    </div>
                ))}
                
            </div>



            <div className={styles["pin-container"]}>
                <button data-testid="pin-btn" onClick={() => {toggleFavourite()}} className={styles["pin-button"]}>  
                    {status.hasPinned ? <MdBookmark/> : <MdBookmarkBorder />}
                </button>
            </div> 
            
           

            {(role === "admin" || role === "superadmin") && (
                
                    <button onClick={() => handleEditCourse(module)} className={styles["edit-container"]}>
                        <p>Edit</p>
                    </button>
                
                
            )}
            
                  
                 
            <button onClick={() => handleViewCourse(module)} className={styles.viewContainer}>
                <p>{isEnrolled(module.id) ? "Continue Learning" : "View Course"}</p>
            </button>

            
            
            {/* Enrollment Modal */}
            <EnrollmentModal
                isOpen={enrollmentModal.isOpen}
                onClose={() => setEnrollmentModal({ isOpen: false, selectedCourse: null })}
                module={enrollmentModal.selectedCourse}
                onEnroll={handleEnroll}
                isEnrolled={module?.id ? isEnrolled(module.id) : false} // safeguard against potential undefined values
            />

        </div>
    )
  
}

export default CourseItem