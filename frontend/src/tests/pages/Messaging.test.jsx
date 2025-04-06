
import { fireEvent, render, screen, waitFor, cleanup, act } from "@testing-library/react";
import Messaging from "../../pages/Messaging";
import { afterEach, beforeEach, expect } from "vitest";
import { vi } from "vitest";
import { AuthContext } from "../../services/AuthContext";
import FileUploader from "../../components/SupportAssets/FileUploader";
import userEvent from "@testing-library/user-event";
import { createEvent } from "@testing-library/react";

vi.mock("../../services/api_chat" ,() => ({
    CreateConversation: vi.fn(),
    GetConversations: vi.fn(),
    DeleteConversation: vi.fn(),
    GetMessages: vi.fn(),
    SendMessage: vi.fn(),

}))


import { CreateConversation, GetConversations, DeleteConversation, GetMessages, SendMessage } from "../../services/api_chat";
  

// HELPER METHODS //

const MockAPIs =  () => {

  GetConversations.mockResolvedValue( [{ id: 1, title: "Test Conversation" , updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true,  user_username: "@user"}]);
  SendMessage.mockResolvedValue({success:true});
  GetMessages.mockResolvedValue([{id: 1, chatID: 1, message: "Hello World!" , sender: 1, sender_username: "@user"},
   {id:2 , chatID: 2, message: "Hello World!" , sender: 1000, sender_username: "@admin"},
   {id:3 ,chatID: 2, file: 'document.pdf' ,message: "Hello World!" , sender: 1000, sender_username: "@admin"}]);
  CreateConversation.mockResolvedValue({id:1});
  
  
}



const FindFACircleButton = () => document.querySelector(".fa-circle-plus");
const FindChatForm = () => document.querySelector('.user-chat-form');
const FindDropZone = () => document.querySelector('.input-zone');
const FindChatBox = async () => {
  return await waitFor(() => {
    const box = document.querySelector(".chat-side-box");
    if (!box) throw new Error("Box not found in DOM");
    return box;
  });
};

const SendClientMessage = async (inputField, userForm, messageStr) => {
  return await act( async() => {

    fireEvent.change(inputField, { target: { value: messageStr } })
    fireEvent.submit(userForm);

  })
}


const ClearAll = () => {cleanup(); vi.clearAllMocks; };


beforeEach(async () => {

    ClearAll();
    MockAPIs();

    await act(async () => {
        render(
          <AuthContext.Provider value={MockUserAuthContext}>
            <Messaging 
               />
          </AuthContext.Provider>
        );
    
        await new Promise(resolve => setTimeout(resolve, 500));
       
    });

    await waitFor(() => {
      
      });
      screen.debug();

  

})

afterEach(() => {
    ClearAll();
})




test(" Send Messages ", async () => {

    const plusIcon = FindFACircleButton();
    expect(plusIcon).toBeInTheDocument();

    await act(async () => { fireEvent.click(plusIcon) });
    
    const chatbox = await FindChatBox();
    expect(chatbox).toBeInTheDocument();

    await act(async () => { fireEvent.click(chatbox) });


    const formBar = FindChatForm();
    expect(formBar).toBeInTheDocument();

    const inputField = screen.getByRole('textbox');
    expect(inputField).toBeInTheDocument();

    await SendClientMessage(inputField, formBar,  'Hello World!');

   
    await act(async() => {
        expect(SendMessage).toHaveBeenCalled();
    })


   const bubble = document.querySelector(".bubble-item")
    expect(bubble).toBeInTheDocument();

    await SendClientMessage(inputField, formBar,  '');
   
})




test(" Send Invalid Messages ", async () => {

  SendMessage.mockRejectedValue(new Error("The Message couldn't be sent!"));

  const plusIcon = FindFACircleButton();
  expect(plusIcon).toBeInTheDocument();

  await act(async () => {
      fireEvent.click(plusIcon);
    });
  
  const chatbox = await FindChatBox();
  expect(chatbox).toBeInTheDocument();

  await act(async () => {
      fireEvent.click(chatbox);
  });

  const formBar = FindChatForm();
    expect(formBar).toBeInTheDocument();

  const inputField = screen.getByRole('textbox');
  expect(inputField).toBeInTheDocument();

    await SendClientMessage(inputField, formBar,  'Invalid message');

   
    await act(async() => {
        expect(SendMessage).toHaveBeenCalled();
    })

})




  test("check page", () => {
    // render(<Messaging />);
   
    expect(document.querySelector(".support-main-container")).toBeInTheDocument();
  });



test("Load conversations", async () => {
   
    expect(GetConversations).toHaveBeenCalledWith("test-token");
    
});



test("Load invalid conversations", async () => {

  ClearAll();

  GetConversations.mockRejectedValue(new Error(" Conversation cannot be found! "));

  render(
    <AuthContext.Provider value={MockUserAuthContext}>
      <Messaging 
         />
    </AuthContext.Provider>
  );

  expect(GetConversations).toHaveBeenCalledWith("test-token");

})



  test("Create conversations", async () => {

    const plusIcon = FindFACircleButton();
    
    expect(plusIcon).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(plusIcon);
      });

    await screen.findByText("Create A New Chat");

    expect(CreateConversation).toHaveBeenCalledWith("test-token", {});


  })

test("Create Invalid Conversation", async() => {

    const mockError = new Error("Invalid Conversation");
    CreateConversation.mockRejectedValue(mockError);


    const plusIcon = FindFACircleButton();
    expect(plusIcon).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(plusIcon);
      });

    await waitFor(() => {
        expect(CreateConversation).toHaveBeenCalledWith('test-token', {});

    }) 

    
})



test(" Deleting Valid Chats", async () => {

   
    
    const deleteButton = screen.getByText("Delete");
    expect(deleteButton).toBeInTheDocument();
    
    await act(async () => {
        fireEvent.click(deleteButton);
      });

    expect(DeleteConversation).toHaveBeenCalled()


})


test(" Get User Messages", async () => {


    const plusIcon = FindFACircleButton();
    expect(plusIcon).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(plusIcon);
      });
    
    const chatbox = await FindChatBox();
    expect(chatbox).toBeInTheDocument();


    await act(async () => {
        fireEvent.click(chatbox);
    });


    const message = await screen.getByText("Delete");
    expect(message).toBeInTheDocument();

})


test(" Get Invalid Mesages ", async () => {
    GetMessages.mockRejectedValue([
        new ErrorEvent("Message could not be retrieved")
    ]);
 

    const plusIcon = FindFACircleButton();
    expect(plusIcon).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(plusIcon);
      });

    const chatbox = await FindChatBox();

    expect(chatbox).toBeInTheDocument();
    await act(async () => {
        fireEvent.click(chatbox);
      });

   
})


test(" Bubble Rendering ", async() => {
  ClearAll();

})


test (" File Message Rendered ", async() => {
  GetMessages.mockResolvedValue([{chatID: 1, file: "document.pdf", message: "Hello World!" , sender:1, sender_username: "@user"}]);

  const plusIcon = FindFACircleButton();
  expect(plusIcon).toBeInTheDocument();

  await act(async () => { fireEvent.click(plusIcon) });
  
  const chatbox = await FindChatBox();
  expect(chatbox).toBeInTheDocument();

  await act(async () => { fireEvent.click(chatbox) });

  expect(document.querySelector('.bubble-file')).toBeInTheDocument();

})

