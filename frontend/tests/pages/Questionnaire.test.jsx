import { test, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios"; // ✅ Import axios
import QuestionnairePage from "../../src/pages/QuestionnairePage";


// Setup

const initial_q_json =  {
    id: 1,
    question: "Are you ready to return to work?",
    yes_next_q: 2,
    no_next_q: 3
}

const yes_q_json =  {
    id: 2,
    question: "Do you still want more support?",
    yes_next_q: null,
    no_next_q: null
}

const no_q_json =  {
    id: 3,
    question: "Do you have anxiety?",
    yes_next_q: null,
    no_next_q: null
}


// Mock axios globally
vi.mock("axios");


beforeEach(() => {
  vi.restoreAllMocks(); // Reset axios mock before each test
  vi.spyOn(window, "alert").mockImplementation(() => {}); // Prevents actual alerts in tests
});




test("Displays error when API call fails", async () => {
  // Mock axios to return a failed request
  axios.get.mockRejectedValue(new Error("API Error"));

  render(<QuestionnairePage />);

  await waitFor(() => {
    expect(screen.getByText(/Failed to load question/i)).toBeInTheDocument();
  });
});

test("Displays initial question when API call is a success", async () => {
  // Mock axios to return a successful response
  axios.get.mockResolvedValue({
    data:initial_q_json
  });

  render(<QuestionnairePage />);


  await waitFor(() => {
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
  
  //screen.debug()

  await waitFor(() => {
    expect(screen.getByText(/Are you ready to return to work?/i)).toBeInTheDocument();
  });
});

test("'Yes' button is present", async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json
    });

    render(<QuestionnairePage />);

    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });

    await waitFor(() => {
        expect(screen.getByRole("button", {name: "Yes"})).toBeInTheDocument();
      });
    
});

test("'No' button is present", async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json
    });

    render(<QuestionnairePage />);

    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });

    await waitFor(() => {
        expect(screen.getByRole("button", {name: "No"})).toBeInTheDocument();
      });
    
});

test("Pressing the yes button goes to the correct question", async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json
    });
    
    axios.post.mockResolvedValue({
        data: yes_q_json
    });

    render(<QuestionnairePage />);

    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });

    const yesButton = screen.getByRole("button", {name: "Yes"});

    // screen.debug();

    await waitFor(() => {
        expect(yesButton).toBeInTheDocument();
      });

    await act(async () => fireEvent.click(yesButton));

    // screen.debug();

    await waitFor(() => {
        expect(screen.getByText(/Do you still want more support?/)).toBeInTheDocument();
    });

});

test("Pressing the no button goes to the correct question", async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json
    });
    
    axios.post.mockResolvedValue({
        data: no_q_json
    });

    render(<QuestionnairePage />);

    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });

    const noButton = screen.getByRole("button", {name: "No"});

    // screen.debug();

    await waitFor(() => {
        expect(noButton).toBeInTheDocument();
      });

    await act(async () => fireEvent.click(noButton));

    // screen.debug();

    await waitFor(() => {
        expect(screen.getByText(/Do you have anxiety?/)).toBeInTheDocument();
    });

});


test("Reaching the end of the questionnaire displays the correct message", async () => {
    axios.get.mockResolvedValue({
        data: yes_q_json
    });

    axios.post.mockResolvedValue({
        data: {
            message: "End of questionnaire"
        }
    });


    // renders page
    render(<QuestionnairePage />);


    // waits for the loading screen
    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });


    // looks for a yes button on page
    const button = screen.getByRole("button", {name: "Yes"});
    await waitFor(() => {
        expect(button).toBeInTheDocument();
    });


    // clicks the button - activates mock post request
    await act(async () => fireEvent.click(button));

    // wait for "end of questionnaire" alert and message
    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("End of questionnaire");
        expect(screen.getByText(/Questionnaire complete!/)).toBeInTheDocument();
    });


})


test("Reaching the end of the questionnaire displays the correct message", async () => {
    axios.get.mockResolvedValue({
        data: yes_q_json
    });

    axios.post.mockResolvedValue({
        data: {
            message: "End of questionnaire"
        }
    });


    // renders page
    render(<QuestionnairePage />);


    // waits for the loading screen
    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });


    // looks for a yes button on page
    const button = screen.getByRole("button", {name: "Yes"});
    await waitFor(() => {
        expect(button).toBeInTheDocument();
    });


    // clicks the button - activates mock post request
    await act(async () => fireEvent.click(button));

    // wait for "end of questionnaire" alert and message
    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("End of questionnaire");
        expect(screen.getByText(/Questionnaire complete!/)).toBeInTheDocument();
    });


});

test("Failed answer submission displays correct error message", async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json 
    });

    axios.post.mockResolvedValue(new Error("Failed Submission"));

    // renders page
    render(<QuestionnairePage />);
    
    // waits for the loading screen
    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    // looks for a No button on page
    const button = screen.getByRole("button", {name: "No"});
    await waitFor(() => {
        expect(button).toBeInTheDocument();
    });

    
    // clicks the button - activates mock post request
    await act(async () => fireEvent.click(button));


    // wait for "end of questionnaire" alert and message
    await waitFor(() => {
        expect(screen.getByText(/Failed to submit answer/)).toBeInTheDocument();
    });
});

test("Invalid question submission displays correct error message", async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json 
    });

    axios.post.mockResolvedValue({
        error: "Invalid question"
    });

    // renders page
    render(<QuestionnairePage />);
    
    // waits for the loading screen
    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    // looks for a No button on page
    const button = screen.getByRole("button", {name: "No"});
    await waitFor(() => {
        expect(button).toBeInTheDocument();
    });

    
    // clicks the button - activates mock post request
    await act(async () => fireEvent.click(button));


    // wait for "end of questionnaire" alert and message
    await waitFor(() => {
        expect(screen.getByText(/Failed to submit answer/)).toBeInTheDocument();
    });


});





