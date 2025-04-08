
import { afterEach, beforeEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';

const callbacks = {}

vi.mock('pusher-js', () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        subscribe: vi.fn(() => ({
          bind: vi.fn((eventName, cb) => {
            if (eventName === 'new-message') {
                callbacks.newMessage = cb;
            }

          }),
        })),
        unsubscribe: vi.fn(),
        disconnect: vi.fn(),
      })),
    };
  });


vi.mock("../../services/api_chat" ,() => ({
    GetConversations: vi.fn(),
}))


import { _StopAllConnections, _GetCallbackSize, myWorker } from '../../services/pusher_websocket';

import * as websocketModule from '../../services/pusher_websocket';
import { GetConversations } from '../../services/api_chat';
  



afterEach( () => {
    _StopAllConnections();
    cleanup()
    vi.clearAllMocks();
})

test("test initialize pusher", () => {
    const spyfunc = vi.spyOn(websocketModule,'initializeBackgroundChats')

    websocketModule.initializeBackgroundChats();
    
    expect(spyfunc).toBeCalled();

})

test("add callback function", () => {
    const spyfunc = vi.spyOn(websocketModule,'AddCallback')

    websocketModule.AddCallback(vi.fn());
    const size = _GetCallbackSize()

    expect(spyfunc).toBeCalled();
    expect(size).toBe(1);
})

test("test subscribe to a chat room", () => {
    const spyfunc = vi.spyOn(websocketModule,'subscribeToChatRoom')

    websocketModule.subscribeToChatRoom(1, vi.fn(), true);

    expect(spyfunc).toBeCalled();


})


test('test branch in onMessage for a new message received', async () => {

    
     websocketModule.initializeBackgroundChats();


    myWorker.port.onmessage({
        data: {
          message: {msg: "hello"}
        }
      });
    
    

  });

  test('test initializing background chats', async () => {

    
    websocketModule.initializeBackgroundChats();
    GetConversations.mockResolvedValue( [{ id: 1, title: "Test Conversation" , updated_at: "2024-04-04T12:00:00.000Z", hasEngaged: true,  user_username: "@user"}]);


   myWorker.port.onmessage({
       data: {
         isWebsocketConnected: false 
       }
     });

    await new Promise(setImmediate);

    expect(typeof callbacks.newMessage).toBe("function");

    callbacks.newMessage({text: "hello world"})

     
 });


 test('test refresh subscriptions', () => {
    websocketModule.RefreshSubscriptions();
 })

 test('test unloading the page', async () => {

    myWorker.port.onmessage({
        data: {
          isWebsocketConnected: false 
        }
      });
 
     await new Promise(setImmediate);



    const event = new Event("beforeunload");
    Object.defineProperty(event, "preventDefault", {
    value: vi.fn(),
    writable: true
  });


    Object.defineProperty(event, "returnValue", {
    value: "",
    writable: true
  });


  window.dispatchEvent(event);

 })