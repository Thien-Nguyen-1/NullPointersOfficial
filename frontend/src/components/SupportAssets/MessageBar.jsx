

import { IoSend } from "react-icons/io5";
import { AuthContext } from "../../services/AuthContext";
import { useContext } from "react";
import FileUploader from "./FileUploader";
import { useState, useCallback, useEffect} from "react";



function MessageBar(props) {

    const {user} = useContext(AuthContext)

    const[inputText, setInputText] = useState("")

    const[file, setFile] = useState([])
    const [isNewFile, setIsNewFile] = useState(false);

    const convObj = props.convObj


    function setFileState(file){
        setFile(file)
        setIsNewFile(true)
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

    useEffect(() => {
        if (file && isNewFile) {
            sendFile();
            setIsNewFile(false)
        }
    }, [file, isNewFile]); 

    

    const sendFile = () => {
        console.log("SENDING THE FILE")
        console.log(file)
        if(file){
            
            const objData = {
                "message" : "UPLOADING FILE",
                "file" : file,
            }

            props.sendNewMessage(objData)
          

        }
    }

    
 

    return(

       
        <form className="user-chat-form flex " onSubmit={(e) => {e.preventDefault(); sendMessage(e)}}>

          
            { (user?.user_type === "service user" || user?.user_type === "admin"  && user?.id === convObj?.admin) && 
                <div>
                    <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => {setInputText(e.target.value)}}/>
                    

                </div>
            }

            
            <FileUploader
                setFileState={setFileState}
                sendFile={sendFile} />

            
            
                    

        </form>
    )

}

export default MessageBar