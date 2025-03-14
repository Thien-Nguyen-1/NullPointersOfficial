
import { useContext } from "react"
import { AuthContext } from "../../services/AuthContext"
import { FaTimes, FaUserCircle } from "react-icons/fa";
import { TiTick } from "react-icons/ti";


function ChatSideBox(props){

    const {user} = useContext(AuthContext)

    const convoObj = props.chat_Detail

    const chatReqObj = {
        "conversation_id" : convoObj.id
    }


    //console.log(convoObj)


    async function assign_chat(){
        props.handleUserCreateChat(chatReqObj)
   
    }

    async function render_chat(){
        console.log("CLICKING")
        props.getUserMessages(convoObj.id)
        props.requestPermissionAndGetToken()
        props.toggleChatVisibility(true)
     
    }


    return (
        <div className="chat-side-box" onClick={render_chat}>

            <div className="chat-profile">
                 <FaUserCircle className="chat-profile-icon"/>
            </div>
            
            
            <div>
                <h3>{convoObj?.user_username}</h3>

                {user?.user_type == "admin" && (
                    <div className="admin-chat-choice">

                        <FaTimes 
                        style={{ color: "red"}}
                        onClick={()=>{}}/>

                        <TiTick 
                        style={{ color: "green"}}
                        onClick={() => {assign_chat()}} />
                    </div>
                )}

            </div>

        </div>



    )


}

export default ChatSideBox