
import { PiWarningCircle } from "react-icons/pi";

function WarningBox(props) {

    return (

        <p className="mini-notif-container"> <PiWarningCircle /> {props.message} </p>
    )
}

export default WarningBox