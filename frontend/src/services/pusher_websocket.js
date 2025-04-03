//Please donnot butcher my beautiful work 🙏

import Pusher from 'pusher-js'
import { GetConversations } from './api_chat';


const connections = {}
const background_connections = {}





const myWorker = new SharedWorker('/shared-worker.js');
myWorker.port.start();



myWorker.port.onmessage = (e) => {
    console.log("From worker, ", e.data)
}



myWorker.port.onmessage = (e) => {
    const isWebsocketConnected = e.data.isWebsocketConnected

    console.log("WEBSOCKET STATUS IS, ", isWebsocketConnected)



    if (isWebsocketConnected !== null && !isWebsocketConnected){
        console.log("Setting up background connections")

        myWorker.port.postMessage({cmd: "UPDATE-WEBSOCKET", data: {"isActive": true}});

        SetUpBackgroundConnections();


    }


}




// export const subscribeToChatRoom = (room_id, callback, isBackground) => {


//     if(isBackground ){
        
//         console.log(room_id)
//         console.log("Subscribing")


//         const channel = pusher.subscribe(`chat-room-${room_id}`)

//         channel.bind('new-message', (data) => {
//             console.log("received mate")

//             if (typeof callback === 'function'){
//                 callback(data);
//             }
            
//         }
//         )

        
//         background_connections[room_id] = channel;
       

//     } else {
//         console.log("CHECKING IF background connection exists")
//         console.log(Object.keys(background_connections))
//         console.log(room_id)

//         if(Object.keys(background_connections).includes(Number.toString(room_id))){
//             console.log("FOUND BACKGROUND CONONECTGIOn")
//         }
        

//     }
// }



const SetUpBackgroundConnections = async () => {
    const allConvos = await GetConversations();

   
    //create a websocket connection to Pusher

    const pusher = new Pusher('d32d75089ef19c7a1669', {
        cluster: 'eu'
    });


    allConvos.forEach(convObj => {
        
        const channel = pusher.subscribe(`chat-room-${convObj.id}`)

        channel.bind('new-message', (data) => {
                
                console.log("Picked up message")
                console.log(data)


                
            }
        )
            

    });



    console.log("===ALL CONVERSATIONS===");
    console.log(allConvos);

  

}



export const subscribeToChatRoom = (room_id, callback, isBackground) => {
    console.log("Sending info on room Number, ", room_id)

    myWorker.port.postMessage({cmd: "SUBSCRIBE-CHAT", data: {"chatID": room_id}})



}

export const initializeBackgroundChats = async(callback) => {

    //check shared worker for existing connection
    myWorker.port.postMessage({cmd: "CHECK-WEBSOCKET",data: null});

    
}




export const unsubscribeToChatRoom = (room_id, callback) => {

    console.log("Cleaning connections with ID ", room_id)

    if (connections[room_id] && room_id){

         pusher.unsubscribe(`chat-room-${room_id}`)


         delete connections[room_id]
        // delete background_connections[room_id]
    }
}




addEventListener("beforeunload", (event) => {

    console.log("beforeunload event triggered!");

    event.preventDefault();  // Required for showing a warning in some browsers
    event.returnValue = "";  // Some browsers require this for confirmation dialog



});