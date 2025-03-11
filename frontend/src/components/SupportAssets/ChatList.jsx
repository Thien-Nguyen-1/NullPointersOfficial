
import ChatSideBox from "./ChatSideBox"

function ChatList(props){

    const allChats = props.all_Chats
    
   // console.log(allChats)

    return (
        <div className="chat-selection-container">
            {allChats?.map( (chat) => (
                <ChatSideBox 
                    key={chat.id}
                    chat_Detail={chat}
                    handleUserCreateChat={props.handleUserCreateChat}
                    getUserMessages={props.getUserMessages}
                    requestPermissionAndGetToken={props.requestPermissionAndGetToken}
                    />
            ) )}
        </div>
    )


}

export default ChatList