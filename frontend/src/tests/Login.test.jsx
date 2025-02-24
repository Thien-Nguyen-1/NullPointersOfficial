import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect, vi } from "vitest";
import Login from "../components/Login";
import { loginUser } from "../services/api";

vi.mock("../src/services/api", () => ({
    loginUser: vi.fn(),
}));

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

    it("should call the login user API when the form is submitted", async () => {
        loginUser
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

});
