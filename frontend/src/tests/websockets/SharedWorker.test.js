import { afterEach, expect } from 'vitest';
import { UpdateWebsocketStatus, SendMessagesAllTabs, handleConnectEvent, IsActiveConnection } from '../../services/workers/shared-worker'; 

// Make sure we can access and reset the same array used in source
import * as WorkerModule from '../../services/workers/shared-worker'; 

const ports = []

beforeEach(() => {

  const fakePort = {
    start: vi.fn(),
    onmessage: null,
    postMessage: vi.fn(),
  }

  ports.push(fakePort)

  WorkerModule.__resetWebsocketStatus(); 
});

afterEach( () => {
    ports.length = 0;
    WorkerModule.__resetWebsocketStatus(); 

    vi.clearAllMocks();
})

test('should push true to the array when isActive is true', () => {
    UpdateWebsocketStatus(true);
    expect(WorkerModule.__getWebsocketStatus().length).toBe(1);
});

test('should reset the array when isActive is false', () => {
    UpdateWebsocketStatus(true); // add one
    UpdateWebsocketStatus(false); // clear it
    expect(WorkerModule.__getWebsocketStatus().length).toBe(0);
});

test('test handle connections', () => {
    
    handleConnectEvent({ports})
    const fakePort = ports[0];


    fakePort.onmessage({ data: { cmd: "CHECK-WEBSOCKET" } });
    expect(fakePort.postMessage).toHaveBeenCalledWith({ isWebsocketConnected: false });

  
    fakePort.postMessage.mockClear();
    fakePort.onmessage({ data: { cmd: "UPDATE-WEBSOCKET", data: { isActive: true } } });
    expect(WorkerModule.__getWebsocketStatus().length).toBe(1);

 
    fakePort.postMessage.mockClear(); 
    fakePort.onmessage({ data: { cmd: "SEND-MESSAGES-TABS", data: "yo" } });
    expect(fakePort.postMessage).toHaveBeenCalledWith({ message: "yo" });

    fakePort.onmessage({ data: { cmd: "DELETE-PORT" } });
   

})

test('test already web socket connected', () => {

    UpdateWebsocketStatus(true);
    const response = IsActiveConnection();

    expect(response).toStrictEqual({
        "isWebsocketConnected" : true
    })


})