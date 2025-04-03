
import React from "react";
import ReactDOM from "react-dom";
import "../styles/OverlayStyles/NotificationOverlay.css";
import { useState, useEffect } from "react";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


import { onMessage } from "firebase/messaging";

import NotifPanel from "../components/notification-assets/NotifPanel";
import { initializeBackgroundChats, AddCallback } from "../services/pusher_websocket";


function NotificationOverlay(props){
    
    const MAX_NOTIFICATIONS = 3

    const pathName = props?.currentRoute.pathname

    const [messages, setMessage] = useState([])

   
    const onMessage = (payload) => {
        console.log(payload)

        setMessage((messages) => {

            const index = messages?.findIndex((msgObj) => msgObj.sender_username === payload.sender_username );

            if (index !== -1 ){
                const updatedMessages  = [...messages];

                updatedMessages[index] = {
                    ...messages[index],
                   'message': payload.message 

                };

                return updatedMessages;

            } else {
                return [payload, ...messages]
            }




        })


    }


    const handleDeleteNotification = (msgDeleteObj) => {
        const index = messages.findIndex((msgObj) => msgObj.data.sender === msgDeleteObj?.data.sender);

        if (index != -1) {  

            setMessage((messages) => {
                const updatedMessages = [...messages];

                updatedMessages.splice(index, 1)

                return updatedMessages

            })
            
        }
    }

    useEffect(() => {
        if(!isValidPath(pathName)){
            setMessage([])
        }
    }, [pathName])
    

    useEffect(() => {
      

        if(localStorage.getItem("token")){
            
            initializeBackgroundChats(onMessage)
            AddCallback(onMessage)
        }

     
        return () => {

        }
    }, [])
    
   
    const arr_invalid_paths = ['/support', '/login', '/signup']

    const isValidPath = (path) => {
        return  !(arr_invalid_paths.some( (invalid_path) => path.includes(invalid_path) ))
    }

    return ReactDOM.createPortal(
        <>
        {isValidPath(pathName) && (
        <div className="notification-overlay-container">

            {messages.map( (msgObj) => (<NotifPanel 
                key={"notif-" + msgObj?.id}
                msgObj={msgObj}
                handleDeleteNotification={handleDeleteNotification}
                
                />) )}
            


        </div>
       
        )
        }
         
        </>, document.getElementById("notification-root")
    )
}

export default NotificationOverlay

