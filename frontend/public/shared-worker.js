

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
    
}



//Send all messages to all ports so every tab is synchronised
const SendMessagesAllTabs = (data, currPort) => {
    console.log("Sendin all mesage")
    console.log(tabConnections)
    tabConnections.forEach( (port) => {
        // if(port !== currPort){

            port.postMessage({"message": data})

        // }
    })

}


// when tab that has connection closes, update flag 



self.onconnect =  (event) => {

    console.log("TAB CONNECTIONS ARE")
    console.log(tabConnections)

    const port = event.ports[0];

    console.log(event.ports)
  
    tabConnections.push(port);
    
    

    console.log("Starting port");


    port.onmessage = (e) => {
       // console.log("Received from tab ", e.data);

        const {cmd, data} = e.data;
        // console.log(cmd)

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
            case "DELETE-PORT":
                tabConnections.splice(tabConnections.findIndex(p => p === port), 1);

            
                
        }

    }

    // port.postMessage("Worker: Staritng port")


    port.start()

}


/* input message of the form:
    cmd: String
    data: {...}

*/