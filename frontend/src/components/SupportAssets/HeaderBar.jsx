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

        <>

            <button onClick={()=>{turnOffChat()}}> {'<'} Back </button>

            <h1> Send Message </h1>
            
            <div>

                {user?.user_type == "admin" && !convObj?.hasEngaged &&(
                    <button onClick={()=> {assign_chat()}}> Accept </button>
                )}
               
                <button onClick={()=> {delete_chat()}}> Delete </button>

            </div>
            


        </>
    )

}

export default ChatHeaderBar