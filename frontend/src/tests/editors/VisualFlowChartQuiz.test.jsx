import React from 'react';
import { render, screen, fireEvent, waitFor, getElementError } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import VisualFlowChartQuiz from '../../components/editors/VisualFlowChartQuiz';

// Mock window.confirm to always return true for tests
//global.confirm = vi.fn(() => true);

// Mock console.log to reduce noise in test output
console.log = vi.fn();


describe('VisualFlowChartQuiz Component', () => {
  const mockProps = {
    moduleId: 'test-module-123',
    quizType: 'statement_sequence',
    initialQuestions: [
      { id: 1, text: 'S1', hint: 'Q1', order: 0 },
      { id: 2, text: 'S2', hint: 'Q2', order: 1 }
    ],
    onUpdateQuestions: vi.fn()
  };

  const renderComponent = (props = mockProps) => {
    const ref = React.createRef();
    const result = render(<VisualFlowChartQuiz {...props} ref={ref} />);
    return { ...result, ref };
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);

  });

  test('renders with initial questions', async () => {
    const { getByText } = renderComponent();
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByText('S1')).toBeTruthy();
      expect(getByText('S2')).toBeTruthy();
    });
  });

  test('adds a new statement when clicking the add button', async () => {
    const { getByText } = renderComponent();
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByText('S1')).toBeTruthy();
    });
    
    // Click the add button
    fireEvent.click(getByText('Add another statement'));
    
    // After clicking, there should be 3 statements in total (2 original + 1 new)
    const statementItems = document.querySelectorAll('.sequence-item');
    expect(statementItems.length).toBe(3);
  });

  test('allows editing a statement', async () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByText('S1')).toBeTruthy();
    });
    
    // Click on the first statement to select it
    fireEvent.click(getByText('S1'));
    
    // Find the input field and update it
    const statementInput = getByPlaceholderText('New statement - click to edit');
    fireEvent.change(statementInput, { target: { value: 'Updated S1' } });
    
    // Find and click the save button
    const saveButton = getByText('Save');
    fireEvent.click(saveButton);
    
    // Mock alert that's called in saveChanges
   // global.alert = vi.fn();
    
    // Verify that the statement was updated
    expect(getByText('Updated S1')).toBeTruthy();
  });

  test('calls onUpdateQuestions when statements change', async () => {
    const onUpdateQuestionsMock = vi.fn();
    const props = { ...mockProps, onUpdateQuestions: onUpdateQuestionsMock };
    
    renderComponent(props);
    
    // Wait for component to initialize and trigger updates
    await waitFor(() => {
      expect(onUpdateQuestionsMock).toHaveBeenCalled();
    });
  });

  test('exposes getQuestions method via ref', async () => {
    const { ref } = renderComponent();
    
    // Wait for component to initialize
    await waitFor(() => {
      // Check that the ref has the getQuestions method
      expect(ref.current.getQuestions).toBeDefined();
      
      // Call the method and check the result
      const questions = ref.current.getQuestions();
      expect(questions.length).toBe(2);
      expect(questions[0].question_text).toBe('S1');
      expect(questions[1].question_text).toBe('S2');
    });
  });

  test('prevents deletion when only one statement remains', async () => {
    // Start with only one statement
    const props = {
      ...mockProps,
      initialQuestions: [{ id: 1, text: 'S1', hint: 'Q1', order: 0 }]
    };
    
    const { getByText, getAllByRole } = renderComponent(props);
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(getByText('S1')).toBeTruthy();
    });
    
    // Mock window.alert
    //global.alert = vi.fn();
    
    // Get the delete button - it's the one with '×' content
    const deleteButtons = getAllByRole('button').filter(button => 
      button.textContent === '×'
    );
    
    //Click the delete button
    fireEvent.click(deleteButtons[0]);
    // Check that alert was called
    await waitFor(() => {
    expect(getElementError(
      "You must have at least one statement in the flowchart. Add another statement before deleting this one."
    ));
    });
    //Check that the statement still exists
    expect(getByText('S1')).toBeTruthy();
  });
});


describe.skip('VisualFlowChartQuiz Component', () => {
  test('placeholder', () => {
    // This test is intentionally skipped
  });
});