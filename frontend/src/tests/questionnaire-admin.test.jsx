// // QuestionnaireAdmin.test.jsx
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import QuestionnaireAdmin from '../pages/questionnaire-admin';
// import { vi } from 'vitest';
// import * as api from '../services/api';

// describe('QuestionnaireAdmin Component', () => {
//   beforeEach(() => {
//     vi.restoreAllMocks();
//   });

//   test('renders page header and buttons', () => {
//     render(<QuestionnaireAdmin />);
//     expect(screen.getByText("Questionnaire Flow")).toBeInTheDocument();
//     expect(screen.getByText("Add New Question")).toBeInTheDocument();
//     expect(screen.getByText("Preview")).toBeInTheDocument();
//     expect(screen.getByText("Save All Changes")).toBeInTheDocument();
//   });

//   test('adds a new question', () => {
//     render(<QuestionnaireAdmin />);
//     fireEvent.click(screen.getByText("Add New Question"));
//     expect(screen.getByText("New Question")).toBeInTheDocument();
//   });

//   test('selects a question and shows editor', () => {
//     render(<QuestionnaireAdmin />);
//     fireEvent.click(screen.getByText("Are you ready to return to work?"));
//     expect(screen.getByLabelText("Question Text:")).toBeInTheDocument();
//   });

//   test('edits question text', () => {
//     render(<QuestionnaireAdmin />);
//     fireEvent.click(screen.getByText("Are you ready to return to work?"));

//     const input = screen.getByLabelText("Question Text:");
//     fireEvent.change(input, { target: { value: "Updated Question?" } });

//     expect(input.value).toBe("Updated Question?");
//   });

//   test('saves changes and calls API', async () => {
//     const submitMock = vi.spyOn(api, 'SubmitQuestionnaire').mockResolvedValue({});

//     render(<QuestionnaireAdmin />);
//     fireEvent.click(screen.getByText("Save All Changes"));

//     await waitFor(() => {
//       expect(submitMock).toHaveBeenCalled();
//     });
//   });
// });

describe.skip('some test suite', () => {
  test('will not run', () => {
    expect(true).toBe(false);
  });
});