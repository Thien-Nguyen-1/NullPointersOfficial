import React, { useContext, useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt , MdBookmark, MdBookmarkBorder, MdOutlineUnsubscribe} from "react-icons/md";
import { AuthContext } from "../services/AuthContext";

import "../styles/CourseItem.css"

function CourseItem(props){

    const module = props.module
    const allUserTracker = props.userTracker

    console.log(allUserTracker)

    const {user, updateUser} = useContext(AuthContext) //to pre-load user's liked + favourite

    const userTracker = useRef(null)
    const totalLikes = useRef(module.upvotes || 0)
    
    //props will also contain methods to call from parent container

    const [status, setStatus] = useState({
        liked: false,
        favourite: false,
    })


    useEffect( () => {

        if (user.module) {


            const user_tempTracker = allUserTracker.find(usrtrck => usrtrck.module === module.id)

            if(user_tempTracker){
                setStatus({...status, liked: user_tempTracker.hasLiked, favourite: user_tempTracker.pinned})
                userTracker.current = user_tempTracker
                
            }

        }
    }, [])


    const toggleLike = () => {

        const usrTracker = userTracker.current

        if (usrTracker){
            usrTracker.hasLiked = !status.liked
            props.update_progress_tracker(usrTracker, usrTracker.id)

            if(!status.liked){
                totalLikes.current += 1
            } else{
                totalLikes.current -= 1
            }

            setStatus( {...status, liked: !status.liked})
        }

    
    
    }

    const toggleFavourite = () => {

        const usrTracker = userTracker.current
        if (usrTracker){
            usrTracker.pinned = !status.favourite
            props.update_progress_tracker(usrTracker, usrTracker.id)


            setStatus( {...status, favourite: !status.favourite})

        }

        
    }

    return (

        <div className="course-opt-container ">
            
            <div className="icon-container">
                <FaSearch />
            </div>
            

            <p> {module.title}</p>

           
            <div className="like-container">
                <button onClick={ () => {toggleLike()}}>
                    {status.liked ? <MdThumbUpAlt /> : <MdThumbUpOffAlt />}
                
                </button>

                <p> {totalLikes.current}</p>

            </div>

            <button onClick={ () => {toggleFavourite()}}>  
                    {status.favourite ? <MdBookmark/> : <MdBookmarkBorder />}
            </button>
           
            <div className="view-container">        
                <button>
                    <p> View Course </p>
                </button>

            </div>
            


        </div>
    )


    
}

export default CourseItem