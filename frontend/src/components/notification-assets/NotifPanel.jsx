import { memo, useEffect } from "react";
import "../../styles/OverlayStyles/NotificationOverlay.css"
import { ProfanityFilter } from "../../services/profanity_filter";
import { useState, useRef } from "react";

function NotificationPanel(props) {

    const msjObj = props.msgObj
    const isInitialRender = useRef(false)
    const [active, setActive] = useState(false)
    
    useEffect(() => {

        if(!isInitialRender.current) {
          
            isInitialRender.current = true
            setActive(true)

            setTimeout(() => setActive(false), 1000)

        } 


    }, [])


    const handleDeleteNotification = () => {
        props.handleDeleteNotification(msjObj)

    }

 

    return (

       
        <div className={`notif-panel-container ${active ? "no-amin" : ""}`}>

           {console.log("RERENDEIRNG: ", msjObj?.notification.body)}

            <div className="notif-vertical-line" /> 

            <div className="notif-msg">
                <h4> {msjObj?.data.sender} </h4>
                <p className="notif-msg-p"> {ProfanityFilter.filterText(msjObj?.notification.body)}</p>
                
               
            </div>


            <div className="notif-close" >
            <button style={{'all' : 'unset'}} onClick={()=>handleDeleteNotification()}> X </button>
            </div>
           
        </div>
    )
}

export default memo(NotificationPanel)
