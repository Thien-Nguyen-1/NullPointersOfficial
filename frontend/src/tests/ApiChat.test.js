
import * as ApiChat from '../services/api_chat'
import api from '../services/api';
import { beforeAll, expect } from 'vitest';
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

  beforeAll( () => {
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


  test("")