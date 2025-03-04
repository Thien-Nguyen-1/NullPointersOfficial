import React, { useContext, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt , MdBookmark, MdBookmarkBorder} from "react-icons/md";
import { AuthContext } from "../services/AuthContext";

import "../styles/CourseItem.css"

function CourseItem(props){

    const module = props.module
    const {user, updateUser} = useContext(AuthContext) //to pre-load user's liked + favourite

    
    //props will also contain methods to call from parent container

    const [status, setStatus] = useState({
        liked: false,
        favourite: false,
    })


    useEffect( () => {
        if (user.module) {
            
            const moduleCheck = user.module.find(usrmod => usrmod.id === module.id)

            if(moduleCheck){
                setStatus({...status, liked: moduleCheck.liked, favourite: moduleCheck.pinned})
            }


        }

    }, [])


    const toggleLike = () => {
        setStatus( {...status, liked: !status.liked})

        // const updatedUser = { 
        //     ...user, 
        //     tags: user.tags.slice(0, -1) 
        // };
        console.log(updatedUser)

       updateUser( updatedUser)

    }

    const toggleFavourite = () => {
        setStatus( {...status, favourite: !status.favourite})

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

                <p> {module.upvotes}</p>


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