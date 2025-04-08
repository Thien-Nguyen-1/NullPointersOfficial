import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RequestPasswordReset from "../../components/auth/RequestPasswordReset"; 
import { AuthContext } from "../../services/AuthContext";
import { BrowserRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component that provides both Router and AuthContext
const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ RequestPasswordReset: vi.fn() }}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("RequestPasswordReset component", () => {
    it("display correct page", () => {
      render(
         <TestWrapper>
          <RequestPasswordReset />
        </TestWrapper>
      );
  
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });
  
    it("should update the email on change", () => {
      render(
         <TestWrapper>
          <RequestPasswordReset />
        </TestWrapper>
      );
  
      const emailInput = screen.getByPlaceholderText("Email");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      expect(emailInput.value).toBe("test@example.com");
    });
  
    it("should call RequestPasswordReset with correct email when form is submitted", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ message: "Email sent" });
  
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ RequestPasswordReset: mockRequest }}>
            <RequestPasswordReset />
          </AuthContext.Provider>
        </BrowserRouter>
      );
  
      const emailInput = screen.getByPlaceholderText("Email");
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith("user@example.com");
      });
    });
  
    it("alerts if there is an errorr", async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error("Invalid email"));
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    
      render(
        <BrowserRouter>
          <AuthContext.Provider value={{ RequestPasswordReset: mockRequest }}>
            <RequestPasswordReset />
          </AuthContext.Provider>
        </BrowserRouter>
      );
    
      const emailInput = screen.getByPlaceholderText("Email");
      fireEvent.change(emailInput, { target: { value: "invalid" } });
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith("invalid");
        expect(alertSpy).toHaveBeenCalledWith(
          "Please enter the valid email address you used to register with."
        );
      });
    
      alertSpy.mockRestore(); // cleanup
    });

    
  });
  