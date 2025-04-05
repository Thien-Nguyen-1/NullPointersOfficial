import React from "react";
import {render, screen, fireEvent, waitFor} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect, vi } from "vitest";
import Login from "../../components/auth/Login";
import { loginUser } from "../../services/api";
import * as api from "../../services/api";
import { AuthContext } from "../../services/AuthContext";


vi.mock("../../services/api", () => ({
    loginUser: vi.fn(),
    redirectBasedOnUserType: vi.fn(),
}));

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


describe("Login component", () => {
    it("Should render the correct login form" , () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        expect(screen.getByPlaceholderText("Username")).to.exist;
        expect(screen.getByPlaceholderText("Password")).to.exist;
        expect(screen.getByRole("button", {name: "Login"})).to.exist;
    });

    it("Should update the username and password fields on change", () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        const usernameInput =screen.getByPlaceholderText("Username");
        const passwordInput =screen.getByPlaceholderText("Password");

        fireEvent.change(usernameInput, {target: {value:"testUser"} });
        fireEvent.change(passwordInput, {target: {value:"password123"} });

        expect(usernameInput.value).toBe("testUser");
        expect(passwordInput.value).toBe("password123");

    });

    it("should go back to welcome page when the back button is clicked", () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        const backButton =screen.getByText("Back");
        expect(backButton).to.exist;
    });

    it("should go to forgot password page when the button is clicked", () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        const forgotPasswordButton =screen.getByText("Forgot password");
        expect(forgotPasswordButton).to.exist;
    });

    it("should go to sign up page when the button is clicked", () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        const signUpButton =screen.getByText("Don't have an account");
        expect(signUpButton).to.exist;
    });

    it("should call loginUser and redirect on successful login", async () => {
        const mockLoginUser = vi.fn().mockResolvedValue({ userType: "admin" });
        const mockRedirect = vi.fn();
      
        render(
          <BrowserRouter>
            <AuthContext.Provider value={{ loginUser: mockLoginUser }}>
              <Login />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      
        fireEvent.change(screen.getByPlaceholderText("Username"), {
          target: { value: "testuser" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
          target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: /login/i }));
      
        await waitFor(() => {
          expect(mockLoginUser).toHaveBeenCalledWith("testuser", "password123");
          expect(api.redirectBasedOnUserType).toHaveBeenCalledWith({ userType: "admin" });
        });
      });
      
      it("should show error message on failed login", async () => {
        const mockLoginUser = vi.fn().mockRejectedValue(new Error("Unauthorized"));
      
        render(
          <BrowserRouter>
            <AuthContext.Provider value={{ loginUser: mockLoginUser }}>
              <Login />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      
        fireEvent.change(screen.getByPlaceholderText("Username"), {
          target: { value: "wronguser" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
          target: { value: "wrongpass" },
        });
        fireEvent.click(screen.getByRole("button", { name: /login/i }));
      
        await waitFor(() => {
          expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
        });
      });

      it("should navigate to '/' when the Back button is clicked", () => {
        render(
          <BrowserRouter>
            <AuthContext.Provider value={{ loginUser: vi.fn() }}>
              <Login />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      
        fireEvent.click(screen.getByText("Back"));
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
      
      it("should navigate to '/password-reset' when the Forgot password button is clicked", () => {
        render(
          <BrowserRouter>
            <AuthContext.Provider value={{ loginUser: vi.fn() }}>
              <Login />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      
        fireEvent.click(screen.getByText("Forgot password"));
        expect(mockNavigate).toHaveBeenCalledWith("/password-reset");
      });
      
      it("should navigate to '/signup' when the Don't have an account button is clicked", () => {
        render(
          <BrowserRouter>
            <AuthContext.Provider value={{ loginUser: vi.fn() }}>
              <Login />
            </AuthContext.Provider>
          </BrowserRouter>
        );
      
        fireEvent.click(screen.getByText("Don't have an account"));
        expect(mockNavigate).toHaveBeenCalledWith("/signup");
      });
      
      

});
