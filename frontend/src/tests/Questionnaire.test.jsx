// import { test, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
// import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
// import "@testing-library/jest-dom";
// import axios from "axios";
// import Questionnaire from "../components/Questionnaire";
// import { GetQuestion, SubmitQuestionAnswer, moduleApi, tagApi } from "../services/api";


// vi.mock("../services/open_router_chat_api", () => ({
//   GetResult: vi.fn(),


// }))


// import { GetResult } from "../services/open_router_chat_api";





// const initial_q_json =  {
//     id: 1,
//     question: "Are you ready to return to work?",
//     yes_next_q: 2,
//     no_next_q: 3
// }

// const yes_q_json =  {
//     id: 2,
//     question: "Do you still want more support?",
//     yes_next_q: null,
//     no_next_q: null
// }

// const no_q_json =  {
//     id: 3,
//     question: "Do you have anxiety?",
//     yes_next_q: null,
//     no_next_q: null
// }


// vi.mock("../services/api", () => ({
//     GetQuestion: vi.fn(),
//     SubmitQuestionAnswer: vi.fn(),
//     moduleApi: {
//       getAll: vi.fn().mockResolvedValue({
//         data: [
//           {title: "Hello", description: "Anxiety"}
//         ]
//       }),
//     },
//     tagApi: {
//       getAll: vi.fn().mockResolvedValue({
//         data: [
//           { tag: "anxiety" },
//           { tag: "stress" },
//         ]
//       }),
//       getById: vi.fn(),
//     },

// }));




// beforeEach(() => {
//   vi.restoreAllMocks();
//   vi.spyOn(window, "alert").mockImplementation(() => {});
//   GetResult.mockResolvedValue("anxiety")
//   moduleApi.getAll.mockResolvedValue({ data: [] }); 
//   tagApi.getAll.mockResolvedValue({ data: [] }); 
// });

// test("HELLO" , () => {

// })




// // test("Displays error when Question API call fails", async () => {

// //   GetQuestion.mockRejectedValue(new Error("Failed to load question "));
  
// //   render(<Questionnaire />);

// //   await waitFor(() => {
// //     expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument();
// //   });
// // });

// // test("Displays error when Module And Tag API call fails", async () => {
// //   moduleApi.getAll.mockRejectedValue(new Error("Failed to load modules and tags"));

// //   render(<Questionnaire />);

// //   await waitFor(() => {
// //     expect(screen.getByText(/Failed to load modules and tags/i)).toBeInTheDocument();
// //   });




// // })

// // test("Displays initial question when API call is a success", async () => {

// //   GetQuestion.mockResolvedValue(initial_q_json);

// //   render(<Questionnaire />);

// //   await waitFor(() => {
// //     expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// //   });

// //   await waitFor(() => {
// //     expect(screen.getByText(/Are you ready to return to work?/i)).toBeInTheDocument();
// //   });
// // });

// // test("'Yes' button is present", async () => {
// //     GetQuestion.mockResolvedValue(initial_q_json);

// //     render(<Questionnaire />);

// //     await waitFor(() => {
// //         expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// //       });

// //     await waitFor(() => {
// //       expect(screen.getByRole("radio", { name: /yes/i })).toBeInTheDocument();
// //       });
    
// // });

// // test("'No' button is present", async () => {
// //     GetQuestion.mockResolvedValue(initial_q_json);

// //     render(<Questionnaire />);

// //     await waitFor(() => {
// //         expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// //       });

// //     await waitFor(() => {
// //         expect(screen.getByRole("radio", {name: "No"})).toBeInTheDocument();
// //       });
    
// // });


// // test("Pressing the yes button goes to the correct question", async () => {
// //   GetQuestion.mockResolvedValue(initial_q_json);
// //   SubmitQuestionAnswer.mockResolvedValue(yes_q_json);
// //   moduleApi.getAll.mockResolvedValue({ data: [] });
// //   tagApi.getAll.mockResolvedValue({ data: [] });

// //   render(<Questionnaire />);


// //   await waitFor(() =>
// //     expect(screen.getByText(/Are you ready to return to work?/i)).toBeInTheDocument()
// //   );


// //   const yesButton = await screen.findByRole("radio", { name: /yes/i });
// //   fireEvent.click(yesButton);


// //   const submitButton = screen.getByRole("button", { name: /submit/i });
// //   fireEvent.click(submitButton);


// //   await waitFor(() => {
// //     expect(
// //       screen.getByText(/Do you still want more support\?/i)
// //     ).toBeInTheDocument();
// //   });
// // });

// // test("Pressing the no button goes to the correct question", async () => {
// //   GetQuestion.mockResolvedValue(initial_q_json);
// //   SubmitQuestionAnswer.mockResolvedValue(no_q_json);
// //   moduleApi.getAll.mockResolvedValue({ data: [] });
// //   tagApi.getAll.mockResolvedValue({ data: [] });

// //   render(<Questionnaire />);


// //   await waitFor(() =>
// //     expect(screen.getByText(/Are you ready to return to work?/i)).toBeInTheDocument()
// //   );


// //   const yesButton = await screen.findByRole("radio", { name: /no/i });
// //   fireEvent.click(yesButton);


// //   const submitButton = screen.getByRole("button", { name: /submit/i });
// //   fireEvent.click(submitButton);

 
// //   await waitFor(() => {
// //     expect(
// //       screen.getByText(/Do you have anxiety\?/i)
// //     ).toBeInTheDocument();
// //   });
// // });


// // test("Reaching the end of the questionnaire displays the correct message", async () => {

// //   vi.spyOn(window, "alert").mockImplementation(() => {});

// //   GetQuestion.mockResolvedValue(yes_q_json);
// //   moduleApi.getAll.mockResolvedValue({ data: [] });
// //   tagApi.getAll.mockResolvedValue({ data: [] });

// //   SubmitQuestionAnswer.mockResolvedValue({ message: "End of questionnaire" });

// //   render(<Questionnaire />);

// //   await waitFor(() => {
// //     expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// //   });

// //   const button = await screen.findByRole("radio", { name: /yes/i });

// //   fireEvent.click(button);

// //   const submitButton = screen.getByRole("button", { name: /submit/i });
// //   fireEvent.click(submitButton);


// //   await waitFor(() => {
// //     expect(window.alert).toHaveBeenCalledWith("End of questionnaire");
// //     expect(
// //       screen.getByText(/thank you for completing the questionnaire/i)
// //     ).toBeInTheDocument();
// //   });
// // });



// // test("Reaching the end of the questionnaire displays the correct message", async () => {
// //     GetQuestion.mockResolvedValue(yes_q_json);
// //     vi.spyOn(window, "alert").mockImplementation(() => {});


// //     SubmitQuestionAnswer.mockResolvedValue({
// //         message: "End of questionnaire"
// //     });

// //     // renders page
// //     render(<Questionnaire />);


// //     // waits for the loading screen
// //     await waitFor(() => {
// //         expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// //     });


// //     // looks for a yes button on page
// //     const button = screen.getByRole("radio", {name: "Yes"});
// //     await waitFor(() => {
// //         expect(button).toBeInTheDocument();
// //     });


// //     // clicks the button - activates mock post request
// //     await act(async () => fireEvent.click(button));

// //     const submitButton = screen.getByRole("button", { name: /submit/i });

// //      await act(async () => fireEvent.click(submitButton));

// //     // wait for "end of questionnaire" alert and message
// //     await waitFor(() => {
      
// //         expect(screen.getByText(/Thank you for completing the Questionnaire/)).toBeInTheDocument();
// //     });


// // });

// // test("Failed answer submission displays correct error message", async () => {
// //     GetQuestion.mockResolvedValue(initial_q_json);

// //     SubmitQuestionAnswer.mockRejectedValue(new Error("Failed to submit answer"));


// //     // renders page
// //     render(<Questionnaire />);
    
// //     // waits for the loading screen
// //     await waitFor(() => {
// //         expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
// //     });

// //     // looks for a No button on page
// //     const button = screen.getByRole("radio", {name: "No"});
// //     await waitFor(() => {
// //         expect(button).toBeInTheDocument();
// //     });

    
// //     // clicks the button - activates mock post request
// //     await act(async () => fireEvent.click(button));


// //     const submitButton = screen.getByRole("button", { name: /submit/i });

// //     await act(async () => fireEvent.click(submitButton));
    

// //     await waitFor(() => {
// //         expect(screen.getByText(/Failed to submit answer/)).toBeInTheDocument();
// //     });
// // });



// // test("When all_responses.current is empty, modules are cleared", async () => {
// //   vi.spyOn(window, "alert").mockImplementation(() => {});

// //   GetQuestion.mockResolvedValue({
// //     id: 1,
// //     question: "Are you ready to return to work?",
// //     yes_next_q: null,
// //     no_next_q: null,
// //   });

// //   SubmitQuestionAnswer.mockResolvedValue({
// //     message: "End of questionnaire",
// //   });

// //   const mockModules = [
// //     { id: 1, title: "Module 1", description: "Stress help", tags: [] },
// //     { id: 2, title: "Module 2", description: "Anxiety help", tags: [] },
// //   ];

// //   moduleApi.getAll.mockResolvedValue({ data: mockModules });
// //   tagApi.getAll.mockResolvedValue({ data: [] });

// //   render(<Questionnaire />);


// //   await screen.findByText(/are you ready to return to work/i);

// //   const noRadio = screen.getByRole("radio", { name: /no/i });
// //   fireEvent.click(noRadio);

// //   const submitButton = screen.getByRole("button", { name: /submit/i });
// //   fireEvent.click(submitButton);

 
// //   await waitFor(() => {
// //     expect(screen.getByText(/thank you for completing the questionnaire/i)).toBeInTheDocument();
// //   });

  
// //   expect(screen.queryByText(/Module 1/)).not.toBeInTheDocument();
// //   expect(screen.queryByText(/Module 2/)).not.toBeInTheDocument();
// // });



// // test("Module suggestions are shown when tags match GetResult output", async () => {
// //   vi.spyOn(window, "alert").mockImplementation(() => {});

// //   // Mock question
// //   GetQuestion.mockResolvedValue({
// //     id: 1,
// //     question: "Do you feel anxious?",
// //     yes_next_q: null,
// //     no_next_q: null,
// //   });

// //   // End of questionnaire message
// //   SubmitQuestionAnswer.mockResolvedValue({
// //     message: "End of questionnaire",
// //   });

// //   // Mock modules with tags (IDs)
// //   const mockModules = [
// //     {
// //       id: 1,
// //       title: "Anxiety Support",
// //       description: "Learn to manage your anxiety.",
// //       tags: ["101"],
// //     },
// //     {
// //       id: 2,
// //       title: "Stress Relief",
// //       description: "Handle stress effectively.",
// //       tags: ["102"],
// //     },
// //   ];
// //   moduleApi.getAll.mockResolvedValue({ data: mockModules });

// //   // Tag list returned from tagApi.getAll()
// //   tagApi.getAll.mockResolvedValue({
// //     data: [{ tag: "anxiety" }],
// //   });

// //   tagApi.getById.mockImplementation((id) => {
// //     if (id === "101") return Promise.resolve({ data: { tag: "anxiety" } });
// //     if (id === "102") return Promise.resolve({ data: { tag: "stress" } });
// //     return Promise.resolve({ data: { tag: "" } });
// //   });

// //   GetResult.mockResolvedValue("anxiety");

// //   render(<Questionnaire />);


// //   await screen.findByText(/do you feel anxious/i);


// //   fireEvent.click(screen.getByRole("radio", { name: /yes/i }));
// //   fireEvent.click(screen.getByRole("button", { name: /submit/i }));


// //   await waitFor(() =>
// //     expect(screen.getByText(/thank you for completing the questionnaire/i)).toBeInTheDocument()
// //   );


// //   expect(screen.getByText(/anxiety support/i)).toBeInTheDocument();
// //   expect(screen.getByText(/learn to manage your anxiety/i)).toBeInTheDocument();

// // });

describe.skip('some test suite', () => {
   test('will not run', () => {
     expect(true).toBe(false);
   });
 });
