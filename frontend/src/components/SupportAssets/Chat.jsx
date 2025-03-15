import { useContext, useState } from "react"

import { AuthContext } from "../../services/AuthContext"
import Bubble from "./Bubble"
import { PiWarningCircle } from "react-icons/pi";
import WarningBox from "./WarningMessage";
import { ProfanityFilter } from "../../services/profanity_filter";


function Chat(props){

    const {user} = useContext(AuthContext)
    const messages = props.allMessages

    
    return (
        <>
        
       
          {messages?.map( (msg) => {



            
            if(user?.id == msg.sender){
                return (
                    <div key={msg.id} className="bubble-container bubble-right mr-1">
                        <Bubble
                            message={ProfanityFilter.filterText(msg.text_content)}
                            background_color="green"


                        />

                    </div>
                )
            } else{
               return (
                 <div key={msg.id} className="bubble-container bubble-left ml-1">
                    <Bubble 
                        message={ProfanityFilter.filterText(msg.text_content)}
                        background_color="grey"
                        

                    />
                 </div>
               )
            }
          })}

          { messages?.filter( (msg) => msg.sender != user?.id ).length == 0 && messages.length == 1 && user.role == "service user" &&
               
               <WarningBox 
                message={"Administrator will respond within 3 working days"}/>
              
          }

        
        </>
    )


}

export default Chat