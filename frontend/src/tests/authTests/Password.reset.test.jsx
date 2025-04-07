import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PasswordReset from "../../components/auth/PasswordReset"; 
import { AuthContext } from "../../services/AuthContext";


const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ uidb64: "123abc", token: "token123" }),
    useNavigate: () => mockNavigate,
  };
});

describe("PasswordReset component", () => {
    it("display correct password chnage form", () => {
      render(
        <AuthContext.Provider value={{ ResetPassword: vi.fn() }}>
          <PasswordReset />
        </AuthContext.Provider>
      );
  
      expect(screen.getByPlaceholderText("New Password")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Confirm New Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });
  
    it("updates fields correctly", () => {
      render(
        <AuthContext.Provider value={{ ResetPassword: vi.fn() }}>
          <PasswordReset />
        </AuthContext.Provider>
      );
  
      const newPasswordInput = screen.getByPlaceholderText("New Password");
      const confirmNewPasswordInput = screen.getByPlaceholderText("Confirm New Password");
  
      fireEvent.change(newPasswordInput, { target: { value: "test1234" } });
      fireEvent.change(confirmNewPasswordInput, { target: { value: "test1234" } });
  
      expect(newPasswordInput.value).toBe("test1234");
      expect(confirmNewPasswordInput.value).toBe("test1234");
    });
  
    it("calls ResetPassword on successful form submission", async () => {
      const mockResetPassword = vi.fn().mockResolvedValue({ message: "Success" });
  
      render(
        <AuthContext.Provider value={{ ResetPassword: mockResetPassword }}>
          <PasswordReset />
        </AuthContext.Provider>
      );
  
      fireEvent.change(screen.getByPlaceholderText("New Password"), {
        target: { value: "newPass123" },
      });
      fireEvent.change(screen.getByPlaceholderText("Confirm New Password"), {
        target: { value: "newPass123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith("newPass123", "newPass123", "123abc", "token123");
      });
    });
  
    it("should show error message when password reset fails", async () => {
      const mockResetPassword = vi.fn().mockRejectedValue(new Error("Failure"));
  
      render(
        <AuthContext.Provider value={{ ResetPassword: mockResetPassword }}>
          <PasswordReset />
        </AuthContext.Provider>
      );
  
      fireEvent.change(screen.getByPlaceholderText("New Password"), {
        target: { value: "failpass" },
      });
      fireEvent.change(screen.getByPlaceholderText("Confirm New Password"), {
        target: { value: "failpass" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  
      await waitFor(() => {
        expect(screen.getByText("Invalid password reset")).toBeInTheDocument();
      });
    });
  
    it("should go to home when back button is clicked", () => {
      render(
        <AuthContext.Provider value={{ ResetPassword: vi.fn() }}>
          <PasswordReset />
        </AuthContext.Provider>
      );
  
      fireEvent.click(screen.getByText("Back"));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  
    it("should go to login page when button is clicked", () => {
      render(
        <AuthContext.Provider value={{ ResetPassword: vi.fn() }}>
          <PasswordReset />
        </AuthContext.Provider>
      );
  
      fireEvent.click(screen.getByText("Login"));
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
  