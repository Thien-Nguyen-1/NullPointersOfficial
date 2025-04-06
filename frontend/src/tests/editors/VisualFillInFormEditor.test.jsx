import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import VisualFillTheFormEditor, { AdminQuestionForm, UserFillInTheBlanks } from '../../components/editors/VisualFillTheFormEditor';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';


describe('VisualFillInFormEditor', () => {
    const mockOnSubmit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnEdit = vi.fn();
    const mockProps = {
        moduleId: 'test-module-id',
        quizType: 'text_input',
        initialQuestions: ['How are you today ____?']
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // test('AdminQuestionForm: should display error when no blanks are present', async () => {
    //     const { getByText, getByRole } = render(<AdminQuestionForm onSubmit={mockOnSubmit} />);
    //     fireEvent.change(getByRole('textbox'), { target: { value: 'What is your name' } });
    //     fireEvent.click(getByText('Add Question'));
    //     await waitFor(() => {
    //         expect(getByText("Each question must contain at least one blank space (____). Please adjust your input.")).toBeInTheDocument();
    //     });
    // });

    // test('AdminQuestionForm: should accept valid question with blanks', async () => {
    //     const { getByText, getByRole } = render(<AdminQuestionForm onSubmit={mockOnSubmit} />);
    //     fireEvent.change(getByRole('textbox'), { target: { value: 'What is your favorite color ____?' } });
    //     fireEvent.click(getByText('Add Question'));
    //     expect(mockOnSubmit).toHaveBeenCalledWith('What is your favorite color ____?');
    // });

    // test('UserFillInTheBlanks: edits and saves a question', async () => {
    //     const { getByText, getByRole } = render(
    //         <UserFillInTheBlanks 
    //             question="What day is today ____?"
    //             index={0}
    //             onDelete={mockOnDelete}
    //             onEdit={mockOnEdit}
    //         />
    //     );
    //     fireEvent.click(getByText('Edit'));
    //     fireEvent.change(getByRole('textbox'), { target: { value: 'What year is it ____?' } });
    //     fireEvent.click(getByText('Save'));
    //     expect(mockOnEdit).toHaveBeenCalledWith(0, 'What year is it ____?');
    // });

    // test('UserFillInTheBlanks: displays and handles edit errors', async () => {
    //     const { getByText, getByRole } = render(
    //         <UserFillInTheBlanks 
    //             question="What day is today ____?"
    //             index={0}
    //             onDelete={mockOnDelete}
    //             onEdit={mockOnEdit}
    //         />
    //     );
    //     fireEvent.click(getByText('Edit'));
    //     fireEvent.change(getByRole('textbox'), { target: { value: 'What day is today?' } });
    //     fireEvent.click(getByText('Save'));
    //     await waitFor(() => {
    //         expect(getByText("Each question must contain at least one blank space (____). Please adjust your input.")).toBeInTheDocument();
    //     });
    // });

    // test('VisualFillTheFormEditor: adds, displays, and deletes questions', async () => {
    //     const { getByText, queryByText, getByRole } = render(<VisualFillTheFormEditor {...mockProps} />);
    //     // Test adding a new question
    //     fireEvent.change(getByRole('textbox'), { target: { value: 'How old are you ____?' } });
    //     fireEvent.click(getByText('Add Question'));
    //     await waitFor(() => {
    //         expect(getByText('How old are you ____?')).toBeInTheDocument();
    //     });

    //     // Test deleting a question
    //     fireEvent.click(getByText('Delete'));
    //     expect(queryByText('How old are you ____?')).not.toBeInTheDocument();
    // });
});
