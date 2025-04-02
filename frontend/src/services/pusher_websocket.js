import Pusher from 'pusher-js'
import { GetConversations } from './api_chat';


const connections = {}
const background_connections = {}


const pusher = new Pusher('d32d75089ef19c7a1669', {
    cluster: 'eu'
});


const myWorker = new SharedWorker('/shared-worker.js');
myWorker.port.start();

//myWorker.port.postMessage("Hello From React")

myWorker.port.onmessage = (e) => {
    console.log("From worker, ", e.data)
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

export const subscribeToChatRoom = (room_id, callback, isBackground) => {
    console.log("Sending info on room Number, ", room_id)

    myWorker.port.postMessage({cmd: "SUBSCRIBE-CHAT", data: {"chatID": room_id}})

    

}




// export const initializeBackgroundChats = async (callback) => {
    

//     const broadcastChannel = new BroadcastChannel("message-channel");
//     const status = sessionStorage.getItem("websocket-chat-connected");


//     if(!status){
       
//         sessionStorage.setItem("websocket-chat-connected", true);

//         const conversations = await GetConversations();

//         conversations.forEach( (convObj) => {
//             subscribeToChatRoom(convObj.id, callback, true)
//         })




//     }




// }



export const initializeBackgroundChats = async (callback) => {
    console.log("STARTUP")
   


}


export const unsubscribeToChatRoom = (room_id, callback) => {

    console.log("Cleaning connections with ID ", room_id)

    if (connections[room_id] && room_id){

         pusher.unsubscribe(`chat-room-${room_id}`)


         delete connections[room_id]
        // delete background_connections[room_id]
    }
}






