// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../services/AuthContext";
import '../App.css'
import { FaCirclePlus } from "react-icons/fa6";
import ChatList from "../components/SupportAssets/ChatList"
import Chat from "../components/SupportAssets/Chat";
import MessageBar from "../components/SupportAssets/MessageBar";
import ChatHeaderBar from "../components/SupportAssets/HeaderBar";
import { GetConversations, CreateConversation, GetMessages, SendMessage, DeleteConversation } from "../services/api_chat";
import { UNSAFE_ErrorResponseImpl } from "react-router-dom";

import "../styles/SupportStyles/Messaging.css"


//TODO: Move to Environmental Variable for non-exposure

const firebaseConfig = {
  apiKey: "AIzaSyDQb9cx05Rm34vwBtrqnywzIa5LYWHhjes",
  authDomain: "readytowork-8cf2f.firebaseapp.com",
  projectId: "readytowork-8cf2f",
  storageBucket: "readytowork-8cf2f.firebasestorage.app",
  messagingSenderId: "1053389486667",
  appId: "1:1053389486667:web:abf7479522b11fc4d5abce",
  measurementId: "G-64C4KL7XTF"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);




function Messaging() {

  const {user, updateUser, token} = useContext(AuthContext)


  const [fcmToken, setFcmToken] = useState(null);

  const [allConvos, setConvos] = useState([])
  const[messages, setMessages] = useState([])


  
  const [chatID, setChatId] = useState(null)
  const [chatVisible, setChatVisible] = useState(false) 




  const chatContainerRef = useRef(null)



  /* ========== ASYNC FUNCTIONALITIES ==========*/

  async function requestPermissionAndGetToken() {
 
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" ) {
        const token = await getToken(messaging, {
          vapidKey: "BGGckvvLfnXH8p6-uj-oP14iIpF3KzayWAn1rx55QdIWTVQxx0tv87koLnCXyS-nuMO0DJZcXeFV4rnJS7Z4ASQ"
        });
        setFcmToken(token);
        await saveFCMToken(token)
      }
    } catch (error) {
      console.error("Error getting token:", error);
     }  
  };

  async function loadConversations() {
    try{
     
      const response_data = await GetConversations(token || localStorage.getItem("token"))
      setConvos(response_data)
     
    } catch(error) {
        console.log("Error fetchinig conversations", error)
    }
  }


 
  async function saveFCMToken(token_in){

    if(user && token_in){
      
      const updatedUser = {...user, "firebase_token": token_in}

      try{
        await updateUser(updatedUser)

        console.log("SAVED USER")


      } catch(error){
       
       }  
    } else {
      console.log("THAT SUCKS")
    }
  }


  /* ========== LOGIC FUNCTIONALITIES ========== */

   useEffect(() => {

      loadConversations()


   }, [])


   onMessage(messaging, (payload) => {

    getUserMessages(chatID)

  })



   /*  ========== GENERIC FUNCTIONALITIES ========== */


   async function handleUserCreateChat(objConvoReq = {}) {

    try{
      const response = await CreateConversation(token, objConvoReq)
      

      await loadConversations()

    } catch(error){
      return error
    }

  }

  async function handleDeleteChat(id){
    try{
      const response = await DeleteConversation(token, id)

      await loadConversations()
      setChatVisible(false)
      setChatId(null)

    }catch(error){
      return error
    }
  }



  async function getUserMessages(id){
  
    try { 
      const response = await GetMessages(token, id)

      setMessages(response)
      setChatId(id)
    

    } catch(error){
      return error
    }

  }



   async function sendNewMessage(objMessage){
      

      if(chatID){
        try{

            await SendMessage(token, chatID, objMessage)

            await getUserMessages(chatID)

            

        }catch(error){
          console.error("Error sending message")

        }

      } else {
        console.log("NO CHAT ID SET")
      }
        
   }

   

   
  
    /* ========== UI FUNCTIONALITIES ==========   */


    useEffect( () => {
        if(chatContainerRef.current){
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])


    function toggleChatVisibility(isVisible=false) {
      
      setChatVisible(isVisible)
      loadConversations()


    }



    return (

     
      <div className="support-main-container ">

        <section className={`create-chat-container  chat-visible-${!chatVisible}`}>
            <h2> Support Page </h2>
            
            <div className="flex" style={{'alignItems':'center', 'gap':'1rem'}}>
              <p> Create A New Chat</p>

              
              {user?.user_type =="service user" && (<FaCirclePlus 
                onClick={()=>{handleUserCreateChat()}}
              />)}
              
            </div>

            <ChatList 
              all_Chats={allConvos} 
              getUserMessages= {getUserMessages}
              
              requestPermissionAndGetToken={requestPermissionAndGetToken}
              toggleChatVisibility={toggleChatVisibility}
              />

        </section>




        <section className= {`view-chat-container chat-visible-${chatVisible}  chat-hidden-${chatVisible}`}>

      
                <header > 
                  
                  <ChatHeaderBar 

                    convObj = {allConvos?.filter((obj)=>obj.id===chatID)[0]}
                    toggleChatVisibility={toggleChatVisibility}
                    handleUserCreateChat={handleUserCreateChat}
                    handleDeleteChat = {handleDeleteChat}

                  />

               
                </header> 

                <div className="chat-container" ref={chatContainerRef}>
                    <Chat 
                   
                      allMessages={messages}
                    
                      />
                </div>
                
                <div className="user-interact-container">

                  <MessageBar 
                    sendNewMessage={sendNewMessage}
                    convObj = {allConvos?.filter((obj)=>obj.id===chatID)[0]}
                    />

                </div>

        </section>
      
      
      </div>
    );
  }
  
export default Messaging;
  
