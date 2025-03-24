
import { createContext, useContext, useEffect, useState } from 'react';



const NotifMessageContext = createContext("")

const NotifMessageProvider = ({children} )=> {

    const [new_messages, setMessages] = useState([])

    
    function AddMessage(msgObj) {
        setMessages( (prevMessages) => [...prevMessages, msgObj?.notification])
    }

    function GetMessages(){
        return new_messages
    }



}


// Notification Object Form

// {
    //     "from": "1053389486667",
    //     "messageId": "f97a5353-5507-4cc4-963d-355f194f9196",
    //     "notification": {
    //       "title": "Test title",
    //       "body": "ayo"
    //     }
    // }