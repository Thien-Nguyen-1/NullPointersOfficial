import axios from 'axios';
import api from './api'

export async function GetConversations(token, objConvoReq = {}){
   console.log(token)
    try{
        const response = await api.get(`api/support/chat-details/`,
        {
            params: objConvoReq,
        })

        return response.data
       
    } catch(error){
        return response.error
    }
}


export async function CreateConversation(token, objConvoReq = {}) {
    try{
        const response = await api.post(`api/support/chat-details/`, objConvoReq)

        return response.data
    }catch(error){
        return response.error
    }
}


export async function GetMessages(token, id=-10){
    try{

        const response = await api.get(`api/support/chat-room/${id}/`)

        return response.data
    }  catch(error){
        return response.error
    }
}


export async function SendMessage(token, id=-10, objMessage = {"message": "", "file": null}){
    try {

        const formData = new FormData(); //in order to send both data and text
        formData.append("message", objMessage.message)

        if(objMessage.file){
            formData.append("file", objMessage.file)
        }


        const response = await api.post(`api/support/chat-room/${id}/`, formData,
        {
            headers:  {"Content-Type": "multipart/form-data"}
        }
        
        )

        

    } catch(error){
        return response.error
    }
}



export async function DeleteConversation(token, id){

 
    try {
        const response = await api.delete(`api/support/chat-details/`, {
            data: {
                "conversation_id": id
            }
        })
        
        

        return response.data

    }catch(error){
        return response.error
    }
}


