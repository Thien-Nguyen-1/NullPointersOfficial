import { useContext, useState } from "react"

import { AuthContext } from "../../services/AuthContext"
import { PiWarningCircle } from "react-icons/pi";
import WarningBox from "./WarningMessage";
import { ProfanityFilter } from "../../services/profanity_filter";
import { FileBubble, Bubble } from "./Bubble";

function Chat(props){

    const {user} = useContext(AuthContext)
    const messages = props.allMessages

    
    return (
        <>
        
          {messages?.map( (msg) => {


            if(user?.id == msg.sender){

                
                return (
                    <div key={`msg-container-${msg.id}`} style={{'marginRight': '1rem'}}>
                        <div key={msg.id} className="bubble-container bubble-right ">

                            {msg.file ? <FileBubble file_url={msg.file} background_color="green"/> :

                            <Bubble
                                message={ProfanityFilter.filterText(msg.text_content)}
                                background_color="green"

                            />

                            }
                            
                        </div>

                        {ProfanityFilter.hasBadWord(msg.text_content) && 
                            <WarningBox 
                        
                            key={`warning-${msg.id}`}
                            message={"Obscene Language Flagged"}/>
                        }
                    </div>
                )
            } else{
               return (
                 <div key={msg.id} className="bubble-container bubble-left ml-1">

                    {msg.file ? <FileBubble file_url={msg.file} background_color="grey"/> :
                    <Bubble 
                        message={ProfanityFilter.filterText(msg.text_content)}
                        background_color="grey"
                        
                    />
                    }
                 </div>
               )
            }
          })}


          { messages?.filter( (msg) => msg.sender != user?.id ).length == 0 && messages.length == 1 && user.user_type == "service user" &&
               <div className="mr-1">
                    <WarningBox 
                        message={"Administrator will respond within 3 working days"}/>

              </div>
              
          }

        </>
    )


}

export default Chat