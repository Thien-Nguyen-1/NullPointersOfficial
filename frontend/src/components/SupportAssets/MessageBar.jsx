

import { IoSend } from "react-icons/io5";
import { AuthContext } from "../../services/AuthContext";
import { useContext } from "react";

function MessageBar(props) {

    const {user} = useContext(AuthContext)

    const convObj = props.convObj

 

    return(

       
        <form className="user-chat-form flex " onSubmit={(e) => {props.sendNewMessage(e)}}>

          
            { (user?.user_type === "service user" || user?.user_type === "admin"  && user?.id === convObj?.admin) && 
                <>
                    <input 
                    type="text"
                    value={props.currentText}
                    onChange={(e) => {props.updateInputText(e.target.value)}}/>
                    

                    <IoSend 
                        className="send-message-button"
                        onClick={()=>{}}/>

                
                </>
            }
            
                    

        </form>
    )

}

export default MessageBar