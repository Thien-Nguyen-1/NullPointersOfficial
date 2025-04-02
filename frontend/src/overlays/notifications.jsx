
import React from "react";
import ReactDOM from "react-dom";
import "../styles/OverlayStyles/NotificationOverlay.css";
import { useState, useEffect } from "react";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// import { setForegroundMessageListener } from "../services/firebase_foreground";
import { onMessage } from "firebase/messaging";
// import { messaging } from "../services/firebase_foreground";
import NotifPanel from "../components/notification-assets/NotifPanel";
import { initializeBackgroundChats } from "../services/pusher_websocket";


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

    // onMessage(messaging, (payload) => {
    //     console.log(messages);
    
    //     setMessage((messages) => {
           
    //         const index = messages.findIndex((msgObj) => msgObj.data.sender === payload?.data.sender);
    
    //         if (index !== -1) {
              
    //             const updatedMessages = [...messages];
                

    //             updatedMessages[index] = {  //keeping original references
    //                 ...messages[index],
    //                 notification:{
    //                     ...messages[index].notification,
    //                     'body': payload.notification.body
    //                 }
    //             }
    
    //             return updatedMessages;
    //         } else {
    
    //             return [payload, ...messages];
    //         }
    //     });
    // });


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
        //subscribeToBackgroundChats(onMessage)
        initializeBackgroundChats(onMessage)
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


// {from: '1053389486667', collapseKey: undefined, messageId: '2bc0c16d-c154-4b47-b78b-3dc6db3666d2', notification: {…}, data: {…}}
// collapseKey
// : 
// undefined
// data
// : 
// {type: 'support-notification', sender: '@admin', 'additional_messages': [],}
// from
// : 
// "1053389486667"
// messageId
// : 
// "2bc0c16d-c154-4b47-b78b-3dc6db3666d2"
// notification
// : 
// {title: '@admin', body: 'fk'}
// [[Prototype]]
// : 
// Object