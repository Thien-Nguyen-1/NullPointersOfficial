import { test, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios"; // ✅ Import axios
import QuestionnairePage from "../../src/pages/QuestionnairePage";

// Mock axios globally
vi.mock("axios");

// Reset axios mock before each test
beforeEach(() => {
  vi.restoreAllMocks();
});

const initial_q_json =  {
    id: 1,
    question: "Are you ready to return to work?",
    yes_next_q: 2,
    no_next_q: 3
}


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

test("Yes button is present"), async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json
    })

    render(<QuestionnairePage />);

    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });

    await waitFor(() => {
        expect(screen.getByRole("button", {name: "Yes"})).toBeInTheDocument();
      });
    
}

test("No button is present"), async () => {
    axios.get.mockResolvedValue({
        data: initial_q_json
    })

    render(<QuestionnairePage />);

    await waitFor(() => {
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });

    await waitFor(() => {
        expect(screen.getByRole("button", {name: "No"})).toBeInTheDocument();
      });
    
}


