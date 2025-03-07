import { useRef, useEffect } from "react";

export function useOutsiderClicker(refElement, optionalArg ){

    useEffect( () => {
        
        function handleOutsideClick(e) {

            if (refElement && refElement.current) {
                if(!refElement.current.contains(e.target)){

                    if (typeof optionalArg == "function"){
                        optionalArg()
                    }
                }

            }



            return () => {
                document.removeEventListener("mousedown", handleOutsideClick)
            }
        }
        document.addEventListener( "mousedown", handleOutsideClick)

    }, [refElement])



}