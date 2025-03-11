import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt , MdBookmark, MdBookmarkBorder, MdOutlineUnsubscribe} from "react-icons/md";
import { AuthContext } from "../services/AuthContext";

import "../styles/CourseItem.css"

function CourseItem(props){

    const navigate = useNavigate();
    const module = props.module
    const userInteractTarget  = props.userInteractTarget


    const {user, updateUser} = useContext(AuthContext) //to pre-load user's liked + favourite

    const userTracker = useRef(null)
    const [totalLikes, addLike] = useState(module.upvotes || 0)
    

    const [status, setStatus] = useState({
        hasLiked: false,
        hasPinned: false,
    })


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
                <button onClick={ () => navigate(`/modules/${module.id}`)}>
                    <p> View Course </p>
                </button>

            </div>
            


        </div>
    )


    
}

export default CourseItem