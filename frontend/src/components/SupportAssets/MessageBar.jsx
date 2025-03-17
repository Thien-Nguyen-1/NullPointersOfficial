

import { IoSend } from "react-icons/io5";
import { AuthContext } from "../../services/AuthContext";
import { useContext } from "react";
import FileUploader from "./FileUploader";
import { useState, useCallback} from "react";



function MessageBar(props) {

    const {user} = useContext(AuthContext)

    const[inputText, setInputText] = useState("")
    const[file, setFile] = useState(null)

    const convObj = props.convObj


    function setFileState(file){
        setFile(file)
    }


    const sendMessage = (e) => {
        e.preventDefault()

        if (inputText.length >= 1) {
            props.sendNewMessage({"message": inputText})

            setInputText("")
        } else {
            console.log("Less than 1 character")
        }
    }

    

    const sendFile = useCallback(() => {
        console.log("SENDING THE FILE")
        
        if(file){

        }
    }, [file])

    
    
 

    return(

       
        <form className="user-chat-form flex " onSubmit={(e) => {sendMessage(e)}}>

          
            { (user?.user_type === "service user" || user?.user_type === "admin"  && user?.id === convObj?.admin) && 
                <>
                    <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => {setInputText(e.target.value)}}/>
                    

                </>
            }

            
            <FileUploader
                sendFile={sendFile} />

            
            
                    

        </form>
    )

}

export default MessageBar