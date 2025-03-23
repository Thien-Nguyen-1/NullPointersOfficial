import axios from 'axios';


const baseURL =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000'; 

    
const api = axios.create({
  baseURL: 'http://localhost:8000', //import.meta.env.VITE_API_URL,
  withCredentials: true,
});


export async function GetConversations(token, objConvoReq = {}){
   console.log(token)
    try{
        const response = await api.get(`api/support/chat-details/`,
        {
            params: objConvoReq,
            headers: {'Authorization': `Token ${token}`}
        })

        return response.data
       
    } catch(error){
        return response.error
    }
}

export async function CreateConversation(token, objConvoReq = {}) {
    try{
        const response = await api.post(`api/support/chat-details/`, objConvoReq,
        {
            headers: {'Authorization': `Token ${token}`}
            
            

        })

        return response.data
    }catch(error){
        return response.error
    }
}

export async function GetMessages(token, id=-10){
    try{

        const response = await api.get(`api/support/chat-room/${id}/`, 
        {
            headers: {'Authorization': `Token ${token}`}
        })

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
            headers:  {'Authorization': `Token ${token}`,
                        "Content-Type": "multipart/form-data"}
        }
        
        )

        

    } catch(error){
        return response.error
    }
}

export async function DeleteConversation(token, id){

 

    try {
        const response = await api.delete(`api/support/chat-details/`, {
            headers: {
                'Authorization': `Token ${token}`
            },
            data: {
                "conversation_id": id
            }
        })
        
        

        return response.data

    }catch(error){
        return response.error
    }
}


