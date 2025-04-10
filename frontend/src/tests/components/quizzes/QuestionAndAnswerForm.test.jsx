import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import QuestionAndAnswerForm from '../../../components/quizzes/QuestionAndAnswerForm';
import { QuizApiUtils } from '../../../services/QuizApiUtils';

// Mock the QuizApiUtils module
vi.mock('../../../services/QuizApiUtils', () => ({
  QuizApiUtils: {
    getQuestions: vi.fn()
  }
}));

// Create a simple localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn()
};

describe('QuestionAndAnswerForm', () => {
  const mockTaskId = 'task-123';
  const mockOnComplete = vi.fn();
  const mockQuestions = [
    { id: 1, text: 'What is React?', order: 0 },
    { id: 2, text: 'What is HTML?', order: 1 }
  ];

  beforeEach(() => {
    // Mock console to avoid console pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Reset mocks
    vi.clearAllMocks();
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
  });

  it('renders loading state', () => {
    render(<QuestionAndAnswerForm taskId={mockTaskId} onComplete={mockOnComplete} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});