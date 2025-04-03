//Please donnot butcher my beautiful work 🙏

import Pusher from 'pusher-js'
import { GetConversations } from './api_chat';


const connections = {}
const background_connections = {}
const callbacks = []

const myWorker = new SharedWorker('/shared-worker.js');
myWorker.port.start();


const pusherInstance = {
    pusher : null
}



myWorker.port.onmessage = (e) => {
    const isWebsocketConnected = e.data.isWebsocketConnected;
    const messageObj = e.data.message;
    // console.log("WEBSOCKET STATUS IS, ", isWebsocketConnected)

    console.log("WE ARE CHECKING ", e.data.message)

    if (messageObj){
        console.log("triggering callbacks")
        callbacks.forEach( (callback) => callback(messageObj));
        return;
    }

    if (isWebsocketConnected !== null && !isWebsocketConnected){
         console.log("Setting up background connections")
        InitializePusher()

        myWorker.port.postMessage({cmd: "UPDATE-WEBSOCKET", data: {"isActive": true}});

        SetUpBackgroundConnections();

        return;


    } 

    


}



const InitializePusher = () => {
    if(!pusherInstance.pusher){
        pusherInstance.pusher = new Pusher('d32d75089ef19c7a1669', {
            cluster: 'eu'
        });
    }
}


const SetUpBackgroundConnections = async () => {
    const allConvos = await GetConversations();

   
    //create a websocket connection to Pusher

    
    // const pusher = new Pusher('d32d75089ef19c7a1669', {
    //     cluster: 'eu'
    // });


    allConvos.forEach(convObj => {
        
        const channel = pusherInstance.pusher.subscribe(`chat-room-${convObj.id}`)

        channel.bind('new-message', (data) => {
                

                console.log("FIRING MESSAGE FOR ", convObj.id );

                myWorker.port.postMessage({cmd:"SEND-MESSAGES-TABS", data: data})

              //  callbacks.forEach( (callback) => callback(data));




                
            }
        )
            

    });


}



export const subscribeToChatRoom = (room_id, callback, isBackground) => {
    // console.log("Sending info on room Number, ", room_id)

    myWorker.port.postMessage({cmd: "SUBSCRIBE-CHAT", data: {"chatID": room_id}})



}

export const initializeBackgroundChats = async(callback) => {

    //check shared worker for existing connection
    myWorker.port.postMessage({cmd: "CHECK-WEBSOCKET",data: null});

    
}


export const AddCallback = (callback) => {
    if(typeof callback === "function"){
        callbacks.push(callback)
    }
}


export const RefreshSubscriptions = () => {
    SetUpBackgroundConnections()
}


export const unsubscribeToChatRoom = (room_id, callback) => {

    // console.log("Cleaning connections with ID ", room_id)

    if (connections[room_id] && room_id){

         pusherInstance.pusher.unsubscribe(`chat-room-${room_id}`)


         delete connections[room_id]
        // delete background_connections[room_id]
    }
}




addEventListener("beforeunload", (event) => {

    // console.log("beforeunload event triggered!");

    // event.preventDefault();  // Required for showing a warning in some browsers
    // event.returnValue = "";  // Some browsers require this for confirmation dialog



});