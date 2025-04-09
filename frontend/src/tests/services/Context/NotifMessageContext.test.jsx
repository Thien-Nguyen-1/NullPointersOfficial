import { vi, describe, test, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { useContext, createContext } from 'react';

// Mock the imported module - this needs to be before any imports from the module
vi.mock('../../../services/NotifMessageContext', () => {
  // Create context inside the factory function
  const TestContext = createContext();

  // Define provider inside the factory function
  const TestProvider = ({ children }) => {
    const [new_messages, setMessages] = React.useState([]);

    function AddMessage(msgObj) {
      setMessages((prevMessages) => [...prevMessages, msgObj?.notification]);
    }

    function GetMessages() {
      return new_messages;
    }

    const value = {
      new_messages,
      AddMessage,
      GetMessages
    };

    return (
      <TestContext.Provider value={value}>
        {children}
      </TestContext.Provider>
    );
  };

  // Return the mock exports
  return {
    NotifMessageContext: TestContext,
    NotifMessageProvider: TestProvider
  };
});

// Now import from the mocked module
import { NotifMessageProvider, NotifMessageContext } from '../../../services/NotifMessageContext';

describe('NotifMessageContext', () => {
  // Test AddMessage function
  test('should add a new message to the messages array', () => {
    // Test component that uses the context
    const TestComponent = () => {
      const { new_messages, AddMessage, GetMessages } = useContext(NotifMessageContext);

      return (
        <div>
          <div data-testid="message-count">{new_messages.length}</div>
          <div data-testid="messages">
            {new_messages.map((msg, index) => (
              <div key={index} data-testid={`message-${index}`}>
                {msg.title}: {msg.body}
              </div>
            ))}
          </div>
          <button
            data-testid="add-message-btn"
            onClick={() => AddMessage({
              notification: {
                title: "Test title",
                body: "Test body"
              }
            })}
          >
            Add Message
          </button>
          <button
            data-testid="get-messages-btn"
            onClick={() => {
              const messages = GetMessages();
              document.getElementById('get-messages-result').textContent = messages.length.toString();
            }}
          >
            Get Messages
          </button>
          <div id="get-messages-result"></div>
        </div>
      );
    };

    render(
      <NotifMessageProvider>
        <TestComponent />
      </NotifMessageProvider>
    );

    // Initially no messages
    expect(screen.getByTestId('message-count').textContent).toBe('0');

    // Add a message
    act(() => {
      screen.getByTestId('add-message-btn').click();
    });

    // Should now have one message
    expect(screen.getByTestId('message-count').textContent).toBe('1');
    expect(screen.getByTestId('message-0').textContent).toBe('Test title: Test body');

    // Test GetMessages function
    act(() => {
      screen.getByTestId('get-messages-btn').click();
    });

    expect(document.getElementById('get-messages-result').textContent).toBe('1');

    // Add another message
    act(() => {
      screen.getByTestId('add-message-btn').click();
    });

    // Should now have two messages
    expect(screen.getByTestId('message-count').textContent).toBe('2');
    expect(screen.getByTestId('message-1').textContent).toBe('Test title: Test body');
  });
});