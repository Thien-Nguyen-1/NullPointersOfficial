

const tabConnections = []
const isWebsocketConnected = []




//check for existing connection 
const IsActiveConnection = () => {
    //{"isWebsocketConnected": true}
    const returnObj = {
        "isWebsocketConnected" : false
    };

    console.log(isWebsocketConnected)
    
    return isWebsocketConnected.length === 0 ? returnObj : {...returnObj, "isWebsocketConnected": true};


}


//Update isWebsocketConnected
const UpdateWebsocketStatus = (isActive) => {
    if(isActive){
        isWebsocketConnected.push(true);
    } else {
        isWebsocketConnected.length = 0;
    }
    return;
}



//Send all messages to all ports so every tab is synchronised
const SendMessagesAllTabs = (data, currPort) => {
    tabConnections.forEach( (port) => {
        if(port !== currPort){

            port.postMessage({"message": data})

        }
    })

}


// when tab that has connection closes, update flag 



self.onconnect =  (event) => {


    const port = event.ports[0];
    tabConnections.push(port) ;

    console.log("Starting port")


    port.onmessage = (e) => {
        console.log("Received from tab ", e.data);

        const {cmd, data} = e.data;
        console.log(cmd)

        switch(cmd){
            case "CHECK-WEBSOCKET":
                port.postMessage(IsActiveConnection());
                return;

            case "UPDATE-WEBSOCKET":
                
                UpdateWebsocketStatus(data.isActive);
                return;

            case "SEND-MESSAGES-TABS":
                SendMessagesAllTabs(data, port);
                return;

                
        }

    }

    // port.postMessage("Worker: Staritng port")


    port.start()

}


/* input message of the form:
    cmd: String
    data: {...}

*/