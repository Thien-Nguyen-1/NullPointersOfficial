//Please donnot butcher my beautiful work 🙏

import Pusher from 'pusher-js'
import { GetConversations } from './api_chat';

import { useContext } from 'react';


const callbacks = []

// const myWorker = new SharedWorker('/shared-worker.js');

export const myWorker = new SharedWorker(new URL('./workers/shared-worker.js', import.meta.url) , {type:'module'});
myWorker.port.start();



const pusherInstance = {
    pusher : null
}


myWorker.port.onmessage = (e) => {
    const isWebsocketConnected = e.data.isWebsocketConnected;
    const messageObj = e.data.message;

    console.log("WE ARE CHECKING WE ARE CHECKING - leclerc's engineer", e.data.message)

    if (messageObj){

        callbacks.forEach( (callback) => callback(messageObj));
        return;

    }

    if (isWebsocketConnected === false){

        InitializePusher()

        myWorker.port.postMessage({cmd: "UPDATE-WEBSOCKET", data: {"isActive": true}});

        SetUpBackgroundConnections();

        return;
    } 
}



const InitializePusher = () => {
    if(!pusherInstance.pusher){
        pusherInstance.pusher = new Pusher('d32d75089ef19c7a1669', {
            cluster: 'eu',
            encrypted: true,
            
        });
    }
}


const SetUpBackgroundConnections = async () => {
    const allConvos = await GetConversations();

    console.log("Initializing all connections", allConvos)


    allConvos?.forEach(convObj => {

     
        if(pusherInstance.pusher){
        const channel = pusherInstance.pusher.subscribe(`chat-room-${convObj.id}`)

        channel.bind('new-message', (data) => {
             
                myWorker.port.postMessage({cmd:"SEND-MESSAGES-TABS", data: data})

            }
        )
        }
            
    });

}



export const subscribeToChatRoom = (room_id, callback, isBackground) => {

    myWorker.port.postMessage({cmd: "SUBSCRIBE-CHAT", data: {"chatID": room_id}})



}

export const initializeBackgroundChats = async(callback) => {

    
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




addEventListener("beforeunload", (event) => {

   

    if(pusherInstance.pusher){
       pusherInstance.pusher.disconnect();

    }

   
    myWorker.port.postMessage({cmd: "DELETE-PORT"})

    event.preventDefault();  // Required for showing a warning in some browsers
    event.returnValue = "";  // Some browsers require this for confirmation dialog



});




//for testing - helper methods:

export const _StopAllConnections = () => {
    if(pusherInstance.pusher){
        pusherInstance.pusher.disconnect();
        pusherInstance.pusher = null;
    } 
    callbacks.length = 0;
}

export const _GetCallbackSize = () => {
    return callbacks.length;
}