// import React, { createContext } from "react";
// import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
// import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// // Import the component to test.
// import Questionnaire from "../components/Questionnaire";

// // Import the API services (they will be mocked)
// import { GetQuestion, SubmitQuestionAnswer, moduleApi, tagApi } from "../services/api";
// import { GetResult } from "../services/open_router_chat_api";

// // Create a dummy AuthContext provider.
// const AuthContext = createContext();
// const fakeUser = { id: 1, name: "Test User", is_first_login: true };
// const updateUserMock = vi.fn();

// // A helper to wrap Questionnaire in necessary providers (AuthContext, and Router for useNavigate & useLocation)
// import { MemoryRouter } from "react-router-dom";
// const renderWithProviders = (ui, { authValue = { user: fakeUser, updateUser: updateUserMock }, route="/questionnaire" } = {}) => {
//   return render(
//     <AuthContext.Provider value={authValue}>
//       <MemoryRouter initialEntries={[route]}>
//         {ui}
//       </MemoryRouter>
//     </AuthContext.Provider>
//   );
// };

// // Replace the real AuthContext with our dummy in tests.
// vi.mock("../services/AuthContext", () => {
//   return {
//     AuthContext: {
//       Consumer: ({ children }) => children({ user: fakeUser, updateUser: updateUserMock }),
//       Provider: ({ value, children }) => <div>{children}</div>,
//     },
//   };
// });

// // --- Mocks for API ---
// vi.mock("../services/api", () => ({
//   GetQuestion: vi.fn(),
//   SubmitQuestionAnswer: vi.fn(),
//   moduleApi: {
//     getAll: vi.fn(),
//   },
//   tagApi: {
//     getAll: vi.fn(),
//     getById: vi.fn(),
//   },
// }));

// vi.mock("../services/open_router_chat_api", () => ({
//   GetResult: vi.fn(),
// }));

// // Sample question objects for testing.
// const initial_q = {
//   id: 1,
//   question: "Are you ready to return to work?",
//   yes_next_q: 2,
//   no_next_q: 3,
// };

// const y_next_q = {
//   id: 2,
//   question: "Do you still want more support?",
//   yes_next_q: null,
//   no_next_q: null,
// };

// const n_next_q = {
//   id: 3,
//   question: "Do you have Anxiety?",
//   yes_next_q: null,
//   no_next_q: null,
// };

// // Sample module data for the end-of-questionnaire view.
// const sampleModules = [
//   { id: 1, title: "Module 1", description: "Description 1", tags: ["101"] },
//   { id: 2, title: "Module 2", description: "Description 2", tags: ["102"] },
// ];

// beforeEach(() => {
//   // Reset all mocks before each test.
//   vi.resetAllMocks();
//   updateUserMock.mockClear();
//   // Default mocks for API calls.
//   GetQuestion.mockResolvedValue(initial_q);
//   SubmitQuestionAnswer.mockResolvedValue(y_next_q);
//   moduleApi.getAll.mockResolvedValue({ data: sampleModules });
//   tagApi.getAll.mockResolvedValue({ data: [] });
//   // Default GetResult returns "No tags available" (so module suggestions are not rendered).
//   GetResult.mockResolvedValue("No tags available");
// });

// afterEach(() => {
//   vi.restoreAllMocks();
// });

// describe("Questionnaire", () => {
//   it("shows Loading... initially", async () => {
//     renderWithProviders(<Questionnaire />);
//     expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
//     // Wait for question load.
//     await waitFor(() =>
//       expect(GetQuestion).toHaveBeenCalled()
//     );
//   });

//   it("displays error message when GetQuestion fails", async () => {
//     GetQuestion.mockRejectedValue(new Error("Failed to load question"));
//     renderWithProviders(<Questionnaire />);
//     await waitFor(() =>
//       expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument()
//     );
//   });

//   it("renders a question with radio buttons", async () => {
//     GetQuestion.mockResolvedValue(initial_q);
//     renderWithProviders(<Questionnaire />);
//     await waitFor(() =>
//       expect(screen.getByText(initial_q.question)).toBeInTheDocument()
//     );
//     // Check that radio inputs for "yes" and "no" exist.
//     expect(screen.getByRole("radio", { name: /yes/i })).toBeInTheDocument();
//     expect(screen.getByRole("radio", { name: /no/i })).toBeInTheDocument();
//   });

//   it("submits answer and updates question when not end-of-questionnaire", async () => {
//     // For this test, SubmitQuestionAnswer returns a next question object without "message".
//     SubmitQuestionAnswer.mockResolvedValue(y_next_q);
//     renderWithProviders(<Questionnaire />);
//     await waitFor(() =>
//       expect(screen.getByText(initial_q.question)).toBeInTheDocument()
//     );
//     // Click on the "yes" radio button.
//     const yesRadio = screen.getByRole("radio", { name: /yes/i });
//     fireEvent.click(yesRadio);
//     // Click the submit button.
//     const submitButton = screen.getByRole("button", { name: /submit/i });
//     fireEvent.click(submitButton);
//     // Next question's text should appear.
//     await waitFor(() =>
//       expect(screen.getByText(y_next_q.question)).toBeInTheDocument()
//     );
//   });

//   it("handles end-of-questionnaire branch", async () => {
//     // Simulate a submission that returns an object with a message.
//     const endResponse = { message: "End of questionnaire" };
//     SubmitQuestionAnswer.mockResolvedValue(endResponse);

//     // Simulate non-empty responses so that the if condition does not clear modules.
//     // For this test, we force all_responses.current to have some value.
//     // We do this by spying on useRef().current after render.
//     renderWithProviders(<Questionnaire />);
//     await waitFor(() =>
//       expect(screen.getByText(initial_q.question)).toBeInTheDocument()
//     );
//     // For testing, simulate clicking "yes" so that the answer is "yes" (and it will add to all_responses)
//     const yesRadio = screen.getByRole("radio", { name: /yes/i });
//     fireEvent.click(yesRadio);
//     // Now submit.
//     const submitButton = screen.getByRole("button", { name: /submit/i });
//     fireEvent.click(submitButton);
    
//     // Now, in this branch, alert should be called with the message:
//     await waitFor(() =>
//       expect(window.alert).toHaveBeenCalledWith("End of questionnaire")
//     );
//     // Also, after submission, question is set to null so that the end UI is rendered.
//     await waitFor(() =>
//       expect(screen.getByText(/Thank you for completing the Questionnaire/i)).toBeInTheDocument()
//     );
//   });

//   it("displays error message when answer submission fails", async () => {
//     SubmitQuestionAnswer.mockRejectedValue(new Error("Failed to submit answer"));
//     renderWithProviders(<Questionnaire />);
//     await waitFor(() =>
//       expect(screen.getByText(initial_q.question)).toBeInTheDocument()
//     );
//     const noRadio = screen.getByRole("radio", { name: /no/i });
//     fireEvent.click(noRadio);
//     const submitButton = screen.getByRole("button", { name: /submit/i });
//     fireEvent.click(submitButton);
//     await waitFor(() =>
//       expect(screen.getByText(/Failed to submit answer/i)).toBeInTheDocument()
//     );
//   });

//   it("redirects to dashboard when Continue is clicked", async () => {
//     // Test the redirectDashboard function.
//     // For this, we simulate the end-of-questionnaire branch.
//     // We need to set SubmitQuestionAnswer to return a message.
//     const endResponse = { message: "End of questionnaire" };
//     SubmitQuestionAnswer.mockResolvedValue(endResponse);
//     // And also mock moduleApi.getAll to return some modules.
//     moduleApi.getAll.mockResolvedValue({ data: sampleModules });
//     // Also simulate GetResult to return a comma-delimited string that matches one module tag.
//     GetResult.mockResolvedValue("anxiety");
//     // Simulate tagApi.getAll and tagApi.getById so that filtering modules works.
//     tagApi.getAll.mockResolvedValue({ data: [{ tag: "anxiety" }] });
//     tagApi.getById.mockResolvedValue({ data: { tag: "anxiety" } });

//     // Spy on updateUser and also mock navigate.
//     const updateUserSpy = vi.fn().mockResolvedValue();
//     const fakeNavigate = vi.fn();
//     // Override useNavigate in this test.
//     vi.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(fakeNavigate);

//     // Render the component.
//     renderWithProviders(<Questionnaire />, { authValue: { user: fakeUser, updateUser: updateUserSpy } });
//     await waitFor(() =>
//       expect(screen.getByText(initial_q.question)).toBeInTheDocument()
//     );

//     // Submit answer with "yes"
//     const yesRadio = screen.getByRole("radio", { name: /yes/i });
//     fireEvent.click(yesRadio);
//     const submitButton = screen.getByRole("button", { name: /submit/i });
//     fireEvent.click(submitButton);

//     // Wait for the end-of-questionnaire UI.
//     await waitFor(() =>
//       expect(screen.getByText(/Thank you for completing the Questionnaire/i)).toBeInTheDocument()
//     );

//     // Click the Continue button.
//     const continueButton = screen.getByRole("button", { name: /Continue/i });
//     fireEvent.click(continueButton);
//     // redirectDashboard should call updateUser and then navigate.
//     await waitFor(() => {
//       expect(updateUserSpy).toHaveBeenCalled();
//       expect(fakeNavigate).toHaveBeenCalledWith("/worker/home");
//     });
//   });
// });
describe.skip('some test suite', () => {
  test('will not run', () => {
    expect(true).toBe(false);
  });
});