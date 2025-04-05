
import { fireEvent, render, screen, waitFor, cleanup, act, userEvent } from "@testing-library/react";
import Messaging from "../../pages/Messaging";
import { afterEach, beforeEach, expect } from "vitest";
import { vi } from "vitest";
import { AuthContext } from "../../services/AuthContext";



vi.mock("../../services/api_chat" ,() => ({
    
    CreateConversation: vi.fn(),
    GetConversations: vi.fn(),
    DeleteConversation: vi.fn(),
    GetMessages: vi.fn(),
    SendMessage: vi.fn(),

}))

import { CreateConversation, GetConversations, DeleteConversation, GetMessages, SendMessage } from "../../services/api_chat";
  

beforeEach(async () => {

     vi.clearAllMocks();

    const sendNewMessage = vi.fn();

    await act(async () => {
        render(
          <AuthContext.Provider value={MockUserAuthContext}>
            <Messaging 
               />
          </AuthContext.Provider>
        );
        // Small delay to allow useEffect to complete
        await new Promise(resolve => setTimeout(resolve, 500));
       
    });

    await waitFor(() => {
        // expect(screen.getByText('sss')).toBeInTheDocument();
      });
      screen.debug();

  

})

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
})


test(" Send Valid Messages ", async () => {

    
    SendMessage.mockResolvedValue({success:true});
    GetMessages.mockResolvedValue([{chatID: 1, message: "Hello World!" , sender:1, sender_username: "@user"}])


    const formBar = document.querySelector('.user-chat-form')
    expect(formBar).toBeInTheDocument();

    const inputText = screen.getByRole('textbox');
    expect(inputText).toBeInTheDocument();

   await act(async() => {
        fireEvent.change(inputText, { target: { value: 'Hello World!' } })
        expect(inputText).toHaveValue('Hello World!');

        fireEvent.submit(formBar);
   })

   
   await act(async() => {
        expect(SendMessage).toHaveBeenCalled();
       // expect(GetMessages).toHaveBeenCalled();
   })



//    const response = screen.getByText("Hello World!")
//    expect(response).toBeInTheDocument();
   screen.debug()


})



//   test("check page", () => {
//     // render(<Messaging />);
   
//     expect(document.querySelector(".support-main-container")).toBeInTheDocument();
//   });



test("Load conversations", async () => {
   
    const mockConversations = [{ id: 1, title: "Test Conversation" , updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true,  user_username: "Tester"}];
    GetConversations.mockResolvedValue(mockConversations);

    expect(GetConversations).toHaveBeenCalledWith("test-token");
    
  });



  test("Create conversations", async () => {

    const plusIcon = document.querySelector(".fa-circle-plus");
    
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


    const plusIcon = document.querySelector(".fa-circle-plus");
    
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

    GetConversations.mockResolvedValue([
        { id: 1, title: "Test Chat", user_username: "Tester", updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true }
    ]);

    CreateConversation.mockResolvedValue({id:1});

    const plusIcon = document.querySelector(".fa-circle-plus");
    expect(plusIcon).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(plusIcon);
      });
    
    const chatbox = await waitFor(() => {
        const box = document.querySelector(".chat-side-box");
        if (!box) throw new Error("Box not found in DOM");
        return box;
    });

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
    CreateConversation.mockResolvedValue({id:2});

    const plusIcon = document.querySelector(".fa-circle-plus");
    expect(plusIcon).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(plusIcon);
      });

    const chatbox = await waitFor(() => {
        const box = document.querySelector(".chat-side-box");
        if (!box) throw new Error("Box not found in DOM");
        return box;
    });

    expect(chatbox).toBeInTheDocument();
    await act(async () => {
        fireEvent.click(chatbox);
      });

   

})






test(" Deleting Invalid Chats", async () => {

    await waitFor( () => {
        GetConversations.mockResolvedValue([{id:1, title: "Hello"}])
    })
   

    
    const mockError = new Error("Failed to delete chat") ;
    DeleteConversation.mockRejectedValue(mockError );

    const deleteButton = screen.getByText("Delete");
    expect(deleteButton).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(deleteButton);
      });

    //await waitFor(() => expect(DeleteConversation).toHaveBeenCalled());

    expect(DeleteConversation).toHaveBeenCalled();

     

})







// test(" Get User Messages", async () => {


//     // GetConversations.mockResolvedValue([
//     //     { id: 1, title: "Test Chat", user_username: "Tester", updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true }
//     // ]);

//     //  CreateConversation.mockResolvedValue({id:1})

//     const plusIcon = document.querySelector(".fa-circle-plus");
//     expect(plusIcon).toBeInTheDocument();
    

//     // const plusIcon = await screen.findByTestId("plus-icon");
//     // expect(plusIcon).toBeInTheDocument();

//     // fireEvent.click(plusIcon);

    
//     // const chatbox = await waitFor(() => {
//     //     const box = document.querySelector(".chat-side-box");
//     //     if (!box) throw new Error("Box not found in DOM");
//     //     return box;
//     //   });


//     // expect(chatbox).toBeInTheDocument();
//     // fireEvent.click(chatbox);



// })