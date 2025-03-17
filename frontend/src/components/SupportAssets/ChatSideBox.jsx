
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


    const updateDate = convoObj?.updated_at.split('T')[0]
    const updateTime = convoObj?.updated_at.split('T')[1].split('.')[0].slice(0, -3)
    


    async function assign_chat(){
        props.handleUserCreateChat(chatReqObj)
   
    }

    async function render_chat(){
     
        props.getUserMessages(convoObj.id)
        props.requestPermissionAndGetToken()
        props.toggleChatVisibility(true)
     
    }


    return (
        <div className="chat-side-box" onClick={render_chat} style={{'backgroundColor': (!convoObj?.hasEngaged && user?.user_type === "admin" ? "#f2edb8" : "")}}>
       
            <div className="chat-profile">
                 <FaUserCircle className="chat-profile-icon"/>
            </div>
            
            
            <div>
                <h3>{convoObj?.user_username}</h3>
                
                <p style={{'fontSize' : '0.7rem', 'fontWeight' : "bold"}}> {updateDate}  |  {updateTime} </p>


            </div>

        </div>



    )


}

export default ChatSideBox