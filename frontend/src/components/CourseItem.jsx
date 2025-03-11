import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt , MdBookmark, MdBookmarkBorder, MdOutlineUnsubscribe} from "react-icons/md";
import { AuthContext } from "../services/AuthContext";
import api from "../services/api";
import EnrollmentModal from "./EnrollmentModal";
import "../styles/CourseItem.css"

function CourseItem(props){

    const navigate = useNavigate();
    const module = props.module
    const userInteractTarget  = props.userInteractTarget
    const role = props.role || "worker"; // Default to worker if role not provided


    const {user, updateUser, token} = useContext(AuthContext) //to pre-load user's liked + favourite

    const userTracker = useRef(null)
    const [totalLikes, addLike] = useState(module.upvotes || 0)
    

    const [status, setStatus] = useState({
        hasLiked: false,
        hasPinned: false,
    })

    // State for the enrollment modal
    const [enrollmentModal, setEnrollmentModal] = useState({
        isOpen: false,
        selectedCourse: null
    });

    // Handle course enrollment before client view the module
    const handleEnroll = async (courseId) => {
        try {
            // Create a ProgressTracker entry for this user and module
            await api.post('/api/progress-tracker/', {
                user: user.id,  
                module: courseId,
                completed: false,  
                pinned: false,     
                hasLiked: false    
            }, {
                headers: { Authorization: `Token ${token}`}
            });
    
            // To close modal
            setEnrollmentModal({isOpen: false, selectedCourse: null});
    
            // To navigate to the module view
            navigate(`/modules/${courseId}`);
        } catch (err) {
            console.error("Error enrolling in course:", err);
            alert("Failed to enroll in course. Please try again later.");
        }
    };

    const handleViewCourse = (course) => {
        if (role === "admin") {
            navigate(`/modules/${course.id}`);
        } else {
            // Only worker sees the enrollment popup
            setEnrollmentModal({
                isOpen: true,
                selectedCourse: module
            });
        }
    };


    useEffect(() => {
        
        if(userInteractTarget){
        
            setStatus({...status, hasLiked: userInteractTarget.hasLiked, hasPinned: userInteractTarget.hasPinned})
        }
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

    return (

        <div className="course-opt-container ">
            
            <div className="icon-container">
                <FaSearch />
            </div>
            

            <p> {module.title}</p>

            <div className="like-container">
                <button onClick={ () => {toggleLike()}}>
                    { status.hasLiked ? <MdThumbUpAlt /> : <MdThumbUpOffAlt /> }
                    
                
                </button>

                <p> {totalLikes}</p>

            </div>

            <button onClick={ () => {toggleFavourite()}}>  
                    { status.hasPinned ? <MdBookmark/> : <MdBookmarkBorder />}
                  
            </button>
           
            <div className="view-container">        
                <button onClick={() => handleViewCourse()}>
                    <p> View Course </p>
                </button>

            </div>
            
            {/* Enrollment Modal */}
            <EnrollmentModal
                isOpen={enrollmentModal.isOpen}
                onClose={() => setEnrollmentModal({ isOpen: false, selectedCourse: null })}
                module={enrollmentModal.selectedCourse}
                onEnroll={handleEnroll}
            />

        </div>
    )
  
}

export default CourseItem