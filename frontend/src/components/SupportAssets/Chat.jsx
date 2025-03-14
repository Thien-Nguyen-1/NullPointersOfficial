import { useContext, useState } from "react"

import { AuthContext } from "../../services/AuthContext"
import Bubble from "./Bubble"


function Chat(props){

    const {user} = useContext(AuthContext)
    const messages = props.allMessages

    console.log(messages)
    console.log("USED ID  is", user?.id)
    

    
    
    return (
        <>
        
       
          {messages?.map( (msg) => {
            
            if(user?.id == msg.sender){
                return (
                    <div key={msg.id} className="bubble-container bubble-right">
                        <Bubble
                            message={msg.text_content}
                            background_color="green"

                        />

                    </div>
                )
            } else{
               return (
                 <div key={msg.id} className="bubble-container bubble-left">
                    <Bubble 
                        message={msg.text_content}
                        background_color="grey"
                    />
                 </div>
               )
            }
          })}

          { messages?.filter( (msg) => msg.sender != user?.id ).length == 0 &&
               <p className="mini-notif-container "> Administrator will respond within 1-3 working days </p>
          }

        
        </>
    )


}

export default Chat