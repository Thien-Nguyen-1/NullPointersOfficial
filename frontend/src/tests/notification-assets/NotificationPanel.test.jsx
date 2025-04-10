import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfanityFilter } from '../../services/profanity_filter.js';
import NotificationPanel from '../../components/notification-assets/NotifPanel.jsx'


// Mock the profanity filter
vi.mock('../../services/profanity_filter', () => ({
  ProfanityFilter: {
    filterText: vi.fn(text => text)
  }
}));

describe('NotificationPanel', () => {
  const mockMsgObj = {
    sender_username: 'TestUser',
    message: 'Hello World'
  };
  
  const mockHandleDeleteNotification = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  test('renders with correct content', () => {
    render(
      <NotificationPanel 
        msgObj={mockMsgObj} 
        handleDeleteNotification={mockHandleDeleteNotification} 
      />
    );
    
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(ProfanityFilter.filterText).toHaveBeenCalledWith('Hello World');
  });

  test('applies "no-amin" class initially and removes it after timeout', () => {
    const { container } = render(
      <NotificationPanel 
        msgObj={mockMsgObj} 
        handleDeleteNotification={mockHandleDeleteNotification} 
      />
    );
    
    const panelContainer = container.querySelector('.notif-panel-container');
    expect(panelContainer).toHaveClass('no-amin');
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(panelContainer).not.toHaveClass('no-amin');
  });

  test('calls handleDeleteNotification when close button is clicked', () => {
    render(
      <NotificationPanel 
        msgObj={mockMsgObj} 
        handleDeleteNotification={mockHandleDeleteNotification} 
      />
    );
    
    const closeButton = screen.getByText('X');
    fireEvent.click(closeButton);
    
    expect(mockHandleDeleteNotification).toHaveBeenCalledWith(mockMsgObj);
  });

  test('handles empty message properly', () => {
    const emptyMsgObj = {
      sender_username: 'TestUser',
      message: ''
    };
    
    render(
      <NotificationPanel 
        msgObj={emptyMsgObj} 
        handleDeleteNotification={mockHandleDeleteNotification} 
      />
    );
    
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(ProfanityFilter.filterText).toHaveBeenCalledWith('');
  });
});