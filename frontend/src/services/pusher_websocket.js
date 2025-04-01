import Pusher from 'pusher-js'
import { AuthContext } from './AuthContext';


const connections = {}
const background_connections = {}

const pusher = new Pusher('d32d75089ef19c7a1669', {
    cluster: 'eu'
});

console.log(connections)
export const subscribeToChatRoom = (room_id, callback) => {


    if(!connections[room_id] && room_id){
        
        console.log(room_id)
        console.log("Subscribing")


        const channel = pusher.subscribe(`chat-room-${room_id}`)

        channel.bind('new-message', (data) => {
            console.log("received mate")

            if (typeof callback === 'function'){
                callback(data);
            }
            
        }
        )

        connections[room_id] = channel


    }
}

export const subscribeToBackgroundChats  = () => {
    

}



export const unsubscribeToChatRoom = (room_id, callback) => {

    console.log("Cleaning connections with ID ", room_id)

    if (connections[room_id] && room_id){

        pusher.unsubscribe(`chat-room-${room_id}`)


        console.log("removing mate")
        delete connections[room_id]
    }
}