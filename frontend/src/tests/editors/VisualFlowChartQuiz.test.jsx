import React from 'react';
import { render, screen, fireEvent, waitFor, getElementError,act } from '@testing-library/react';
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
  const mockEmptyProps = {
    moduleId: 'test-module-123',
    quizType: 'statement_sequence',
    initialQuestions: [
      { id: 1, text: '', hint: '', order: 0 },
    ]
    ,
    onUpdateQuestions: vi.fn()
  };

  const renderComponent = (props = mockProps) => {
    const ref = React.createRef();
    const result = render(<VisualFlowChartQuiz {...props} ref={ref} />);
    return { ...result, ref };
  };


  const renderComponentWithEmptyQuestions = () => {
    const ref = React.createRef();
    const utils = render(<VisualFlowChartQuiz {...mockEmptyProps} initialQuestions={[]} ref={ref} />);
    return { ...utils, ref };
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
    
    
    
    const deleteButtons = getAllByRole('button').filter(button => 
      button.textContent === '×'
    );
    
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
    expect(getElementError(
      "You must have at least one statement in the flowchart. Add another statement before deleting this one."
    ));
    });
    expect(getByText('S1')).toBeTruthy();
  });

test('setQuestions method updates and selects statements correctly', async () => {
  const { ref } = renderComponent();

  await waitFor(() => {
    expect(ref.current).toBeDefined();
  });

  const newQuestions = [
    { id: 3, text: 'New Statement 1', hint_text: 'New Question 1', order: 2 },
    { id: 4, text: 'New Statement 2', hint_text: 'New Question 2', order: 3 }
  ];

  act(() => {
    ref.current.setQuestions(newQuestions);
  });

  await waitFor(() => {
    const statements = ref.current.getQuestions();
    expect(statements.length).toBe(2);
    expect(statements[0].question_text).toBe('New Statement 1');
    expect(statements[1].question_text).toBe('New Statement 2');

  });
  
});

it('creates a default statement when initialQuestions is empty', async () => {
  const { ref } = renderComponentWithEmptyQuestions();
  
 
  await waitFor(() => {
    expect(ref.current).toBeDefined();

    const questions = ref.current.getQuestions();
    
    expect(screen.getByDisplayValue('Sample Answer')).toBeInTheDocument();

  });
});


test('prevents deletion when only one statement remains', async () => {
  // Setup with only one statement
  const props = {
    ...mockProps,
    initialQuestions: [{ id: 1, text: 'S1', hint: 'Q1', order: 0 }]
  };

  const { getByText } = render(<VisualFlowChartQuiz {...props} />);
  await waitFor(() => {
    expect(getByText('S1')).toBeInTheDocument();
  });

  const deleteButton = getByText('×'); // Assuming delete button is labeled with '×'
  fireEvent.click(deleteButton);

  // Confirm was not called since it should bail out before that
  expect(window.confirm).not.toHaveBeenCalled();
  expect(getByText('S1')).toBeInTheDocument();
});

test('deletes a statement correctly', async () => {
  const { getByText, queryByText } = render(<VisualFlowChartQuiz {...mockProps} />);
  await waitFor(() => {
    expect(getByText('S1')).toBeInTheDocument();
    expect(getByText('S2')).toBeInTheDocument();
  });

  const deleteButtons = screen.getAllByText('×');
  fireEvent.click(deleteButtons[0]); // Delete the first statement

  // Confirm deletion
  expect(window.confirm).toHaveBeenCalled();

  await waitFor(() => {
    expect(queryByText('S1')).not.toBeInTheDocument();
    expect(getByText('S2')).toBeInTheDocument(); // Only S2 should remain
  });
});


});





describe.skip('VisualFlowChartQuiz Component', () => {
  test('placeholder', () => {
    // This test is intentionally skipped
  });
});