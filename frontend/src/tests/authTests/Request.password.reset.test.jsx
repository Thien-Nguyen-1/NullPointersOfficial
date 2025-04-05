import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RequestPasswordReset from "../../components/auth/RequestPasswordReset"; // Adjust path if needed
import { AuthContext } from "../../services/AuthContext";

describe("RequestPasswordReset component", () => {
    it("renders email input and confirm button", () => {
      render(
        <AuthContext.Provider value={{ RequestPasswordReset: vi.fn() }}>
          <RequestPasswordReset />
        </AuthContext.Provider>
      );
  
      expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });
  
    it("updates the email input on change", () => {
      render(
        <AuthContext.Provider value={{ RequestPasswordReset: vi.fn() }}>
          <RequestPasswordReset />
        </AuthContext.Provider>
      );
  
      const emailInput = screen.getByPlaceholderText("email");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      expect(emailInput.value).toBe("test@example.com");
    });
  
    it("calls RequestPasswordReset with correct email on form submit", async () => {
      const mockRequest = vi.fn().mockResolvedValue({ message: "Email sent" });
  
      render(
        <AuthContext.Provider value={{ RequestPasswordReset: mockRequest }}>
          <RequestPasswordReset />
        </AuthContext.Provider>
      );
  
      const emailInput = screen.getByPlaceholderText("email");
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith("user@example.com");
      });
    });
  
    it("calls alert on failed request", async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error("Invalid email"));
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    
      render(
        <AuthContext.Provider value={{ RequestPasswordReset: mockRequest }}>
          <RequestPasswordReset />
        </AuthContext.Provider>
      );
    
      const emailInput = screen.getByPlaceholderText("email");
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
  