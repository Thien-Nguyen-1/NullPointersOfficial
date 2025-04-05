import React from "react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect } from "vitest";
import Welcome from "../../components/auth/Welcome";
import {render, screen, fireEvent} from "@testing-library/react";

import { useNavigate } from "react-router-dom"; // Import useNavigate

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate, // Mocking useNavigate
  };
});

describe("Welcome component", () => {
    it("should go to login page when the button is clicked", () => {
        render(
            <BrowserRouter> <Welcome/> </BrowserRouter>
        );
        const loginButton =screen.getByText("Login");
        expect(loginButton).to.exist;
    });

    it("should go to signup page when the button is clicked", () => {
        render(
            <BrowserRouter> <Welcome/> </BrowserRouter>
        );
        const signupButton =screen.getByText("Sign Up");
        expect(signupButton).to.exist;
    });

    it("navigates to /signup when Sign Up button is clicked", () => {
        render(<Welcome />);
        fireEvent.click(screen.getByText("Sign Up"));
        expect(mockNavigate).toHaveBeenCalledWith("/signup");
      });
    
      it("navigates to /login when Login button is clicked", () => {
        render(<Welcome />);
        fireEvent.click(screen.getByText("Login"));
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    
      it("renders the welcome message correctly", () => {
        render(<Welcome />);
        expect(screen.getByText("Empower")).toBeInTheDocument();
        expect(screen.getByText("Please sign up or log in to continue.")).toBeInTheDocument();
      });
});