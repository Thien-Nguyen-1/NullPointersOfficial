import { useContext } from "react"
import { AuthContext } from "../../services/AuthContext"

function ChatHeaderBar(props){

    const {user} = useContext(AuthContext)
    const convObj = props.convObj


    const chatReqObj = {
        "conversation_id" : convObj?.id
    }



    function turnOffChat() {
        props.toggleChatVisibility(false)
    }


    async function assign_chat(){
        props.handleUserCreateChat(chatReqObj)
   
    }

    async function delete_chat(){
        props.handleDeleteChat(convObj?.id)
    }

    return (

        <div className="chat-header-container">
            
            <div>
                <button 
                    className="back-chat-button"
                    style={{
                        'background' : 'none',
                        'color': '#5c5e5d',
                        'fontWeight' : '900',
                        'fontSize' : '1.2rem'
                    }}
                    onClick={()=>{turnOffChat()}}> {'<'} Back </button>

                <h1> Send Message </h1>
            </div>

            <div>

                {user?.user_type == "admin" && !convObj?.hasEngaged &&(
                    <button 
                        style={{'backgroundColor':'green'}}
                        onClick={()=> {assign_chat()}}> Accept </button>
                )}
               
                <button 
                    className="ml-1" 
                    style={{'backgroundColor':'red'}}
                    onClick={()=> {delete_chat()}}> Delete </button>

            </div>
            


        </div>
    )

}

export default ChatHeaderBar