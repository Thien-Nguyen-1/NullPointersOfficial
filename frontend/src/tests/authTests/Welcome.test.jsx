import React from "react";
import { describe, it ,expect } from "vitest";
import Welcome from "../../components/auth/Welcome";
import {render, screen, fireEvent} from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate, 
  };
});

describe("Welcome component", () => {
    it("dispays welcome page", () => {
        render(<Welcome />);
        expect(screen.getByText("Empower")).toBeInTheDocument();
        expect(screen.getByText("Please sign up or log in to continue.")).toBeInTheDocument();
      });
    it("should go to signup page when the button is clicked", () => {
        render(<Welcome />);
        fireEvent.click(screen.getByText("Sign Up"));
        expect(mockNavigate).toHaveBeenCalledWith("/signup");
      });
    
      it("should go to login page when the button is clicked", () => {
        render(<Welcome />);
        fireEvent.click(screen.getByText("Login"));
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    
});