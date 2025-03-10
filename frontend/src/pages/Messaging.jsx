// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../services/AuthContext";
import '../App.css'
import { FaCirclePlus } from "react-icons/fa6";
import ChatList from "../components/SupportAssets/ChatList"
import Chat from "../components/SupportAssets/Chat";
import { GetConversations, CreateConversation, GetMessages } from "../services/api_chat";
import { UNSAFE_ErrorResponseImpl } from "react-router-dom";
import '../styles/SupportStyles/Messaging.css'
import { IoSend } from "react-icons/io5";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allConvos, setConvos] = useState([])

  const[messages, setMessages] = useState([])

  const {user, updateUser, token} = useContext(AuthContext)
  

  const messaging = getMessaging()

  onMessage(messaging, (payload) => {

    console.log('Message received ', payload)


  })



  async function requestPermissionAndGetToken() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: "BGGckvvLfnXH8p6-uj-oP14iIpF3KzayWAn1rx55QdIWTVQxx0tv87koLnCXyS-nuMO0DJZcXeFV4rnJS7Z4ASQ"
        });
        setFcmToken(token);
      }
    } catch (error) {
      console.error("Error getting token:", error);
    } finally {
      setLoading(false);
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

  async function saveFCMToken(){

    if(user && !loading){
      console.log(`USER IS ${user.firebase_token}`)

      setLoading(true)
      
      const updatedUser = {...user, "firebase_token": fcmToken}

      try{
        await updateUser(updatedUser)


      } catch(error){

      } finally {
        setLoading(false)
        
      }
            
    }
  }


   useEffect(() => {

      requestPermissionAndGetToken()
      loadConversations()
      saveFCMToken()

   }, [])

   /*  ========== GENERIC FUNCTIONALITIES ========== */


   async function handleUserCreateChat(objConvoReq = {}) {

    console.log("Received ", objConvoReq)
    
    try{
      const response = await CreateConversation(token, objConvoReq)
      

      await loadConversations()

    } catch(error){
      return error
    }

  }

  async function getUserMessages(id){
    console.log("Fetching All Messages")
    try { 


      const response = await GetMessages(token, id)
      
      console.log(response)
       

    } catch(error){
      return error
    }



  }


   async function setCurrentChat(){
    //update state to set current chat 
    




   }

   async function sendMessage(){

   }
  
    /* ========== USER FUNCTIONALITIES ==========   */




   /* ========== ADMIN FUNCTIONALITIES ==========   */

   async function acceptChat() {
    if(user){ 


    }
   }



    return (
      <div className="support-main-container ">


        <section className="create-chat-container">
            <h2> Support Page </h2>
            
            <div className="flex">
              <p> Create A New Chat</p>

              

              {user?.user_type =="service user" && (<FaCirclePlus 
                onClick={()=>{handleUserCreateChat()}}
              />)}
              
            </div>

            <ChatList 
              all_Chats={allConvos} 
              handleUserCreateChat={handleUserCreateChat}
              getUserMessages= {getUserMessages}/>

        </section>




        <section className="view-chat-container">
                <header className="chat-header"> 
                    <h2> Send Message</h2>
                    <p>sduhs</p>

                </header>

                <div className="chat-container">
                    <Chat />
                </div>
                
                <div className="user-interact-container">
                  <form className="user-chat-form flex ">

                      <input 
                        type="text"/>

                      <IoSend 
                        className="send-message-button"
                        onClick={()=>{}}/>
                    

                  </form>
                </div>

        </section>
      
      
      </div>
    );
  }
  
export default Messaging;
  