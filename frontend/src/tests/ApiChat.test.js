
import * as ApiChat from '../services/api_chat'
import api from '../services/api';
import { afterAll, beforeAll, expect } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('../services/api', () => {
    return {
      default: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      }
    };
  });
  

  const token = "test-token"

  afterAll( () => {
    cleanup()
    vi.clearAllMocks();

  })



  test("Retrieve All Conversations" , async () => {
    api.get.mockResolvedValue({
        data: {
            id: 1, title: "Test Conversation" , updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true,  user_username: "@user"
        }

    });

    const response = await ApiChat.GetConversations(token, {});
    expect(api.get).toBeCalledWith("api/support/chat-details/", {"params": {}});

    expect(response).toStrictEqual({
            id: 1, title: "Test Conversation" , updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true,  user_username: "@user"
    })

  })

  test("Retrieve Invalid Conversations" , async () => {

    api.get.mockRejectedValue(
        new Error("Unable to retrieve data")
     );

    
    const response = await ApiChat.GetConversations(token, {});
    expect(response).toBeInstanceOf(Error)

  })


  test("Create A Conversation", async () => {

    api.post.mockResolvedValue({
        data: {
         message : "success"
        }
    })

    const response = await ApiChat.CreateConversation(token,  {"conversation_id" : 1});
    expect(api.post).toBeCalledWith(`api/support/chat-details/`, {"conversation_id" : 1});
    expect(response).toStrictEqual({message: 'success'});
    

  })

  test("Create Invalid Conversation", async () => {
    api.post.mockRejectedValue(
        new Error("Unable to set data")
     );

     const response = await ApiChat.CreateConversation(token, {});
     expect(response).toBeInstanceOf(Error);


  })


  test("Retrieve Valid Messages", async () => {
    api.get.mockResolvedValue( {
        data : [{id: 1, chatID: 1, text_content: "$test_profanity$" , sender: 1, sender_username: "@user"}]
  })

    const response = await ApiChat.GetMessages(token, 1)
    expect(api.get).toBeCalledWith(`api/support/chat-room/1/`);
    expect(response).toStrictEqual(  [{id: 1, chatID: 1, text_content: "$test_profanity$" , sender: 1, sender_username: "@user"}]);


  })

  test("Retrieve Invalid Messages", async () => {
    api.get.mockRejectedValue(
        new Error("Unable to retrieve data")
     );

     const response = await ApiChat.GetMessages(token, null);
     expect(response).toBeInstanceOf(Error);


  })

  test("Delete Valid Conversation", async () => {
    api.delete.mockResolvedValue({
        data: {
            message : "Successfully deleted conversation"
        }
    });

    const response = await ApiChat.DeleteConversation(token, 1);
    expect(api.delete).toBeCalledWith(`api/support/chat-details/`, {data: { "conversation_id": 1}});
    expect(response).toStrictEqual({message: "Successfully deleted conversation"});


  })

  test("Delete Invalid Conversation", async () => {
    api.delete.mockRejectedValue(new Error("Unable to delete conversation"))

    const response = await ApiChat.DeleteConversation(token, 1);
    expect(response).toBeInstanceOf(Error);

  })


  test("Send Valid Message", async () => {

    api.post.mockResolvedValue({
        data: {
            message: "Successfully Saved Message"
        }
     })

    const msgObj = {"message": "Hello World!", "file": null}
    const response = await ApiChat.SendMessage(token, 1, msgObj)
    expect(response).toStrictEqual({message: "Successfully Saved Message"})

    const msgObj_ = {"message": "Hello World!", "file": {file: ".pdf"}}
    const response_ = await ApiChat.SendMessage(token, 1, msgObj_)
    expect(response_).toStrictEqual({message: "Successfully Saved Message"})

  })

  test("Send Invalid Message", async () => {
    api.post.mockRejectedValue(new Error("Unable to send message"));

    const response = await ApiChat.SendMessage(token, 1, null);
    expect(response).toBeInstanceOf(Error);

  })