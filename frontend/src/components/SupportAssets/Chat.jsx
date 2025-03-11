import { useContext, useState } from "react"

import { AuthContext } from "../../services/AuthContext"
import Bubble from "./Bubble"


function Chat(props){

    const {user} = useContext(AuthContext)
    const messages = props.allMessages

    
    
    return (
        <>
          {messages?.map( (msg) => {
            
            if(user?.id == msg.sender){
                return (
                    <div key={msg.id} className="bubble-container right">
                        <Bubble
                            message={msg.text_content}
                            background_color="green"

                        />

                    </div>
                )
            } else{
               return (
                 <div key={msg.id} className="bubble-container left">
                    <Bubble 
                        message={msg.text_content}
                        background_color="grey"
                    />
                 </div>
               )
            }
          })}
        
        </>
    )


}

export default Chat