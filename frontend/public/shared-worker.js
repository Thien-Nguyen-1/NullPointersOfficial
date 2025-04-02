

const tabConnections = []

importScripts('https://js.pusher.com/7.0/pusher.min.js');


const pusher = new Pusher('d32d75089ef19c7a1669', {
    cluster: 'eu'
});



const SubscribeWebsocket = (data) => {
    const chatID = data["chatID"];
    
    if (chatID) {
        const channel = pusher.subscribe(`chat-room-${chatID}`)
        console.log("binded channel")
        channel.bind('new-message', (data) => {
            

            tabConnections.forEach( (port) => {
                port.postMessage({"message": data})

            })


        });


    }
}

self.onconnect =  (event) => {
    const port = event.ports[0];
    tabConnections.push(port) ;

    console.log("Starting port")


    port.onmessage = (e) => {
        console.log("Received from tab ", e.data);

        const {cmd, data} = e.data;

        switch(cmd){
            case "SUBSCRIBE-CHAT":
                SubscribeWebsocket(data)
                
        }


    }

    // port.postMessage("Worker: Staritng port")


    port.start()

}


/* input message of the form:
    cmd: String
    data: {...}

*/