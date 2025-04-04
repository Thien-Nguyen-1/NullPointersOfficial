import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect, vi } from "vitest";
import Signup from "../components/SignUp";
import { signUpUser } from "../services/api";

vi.mock("../src/services/api", () => ({
    signUpUser: vi.fn(),
}));

describe("Signup component", () => {
    it("Should render the correct sign up form" , () => {
        render(
            <BrowserRouter> <Signup/> </BrowserRouter>
        );
        expect(screen.getByPlaceholderText("Username")).to.exist;
        expect(screen.getByPlaceholderText("First Name")).to.exist;
        expect(screen.getByPlaceholderText("Last Name")).to.exist;
        expect(screen.getByPlaceholderText("Email")).to.exist;
        // expect(screen.getByPlaceholderText("")).to.exist;
        expect(screen.getByPlaceholderText("Password")).to.exist;
        expect(screen.getByPlaceholderText("Confirm Password")).to.exist;
        expect(screen.getByRole("button", {name: "Sign Up"})).to.exist;
    });

    it("Should update fields on change", () => {
        render(
            <BrowserRouter> <Signup/> </BrowserRouter>
        );
        const usernameInput =screen.getByPlaceholderText("Username");
        const firstNameInput =screen.getByPlaceholderText("First Name");
        const lastNameInput =screen.getByPlaceholderText("Last Name");
        const emailInput =screen.getByPlaceholderText("Email");
        const passwordInput =screen.getByPlaceholderText("Password");
        const confirmPasswordInput =screen.getByPlaceholderText("Confirm Password");

        fireEvent.change(usernameInput, {target: {value:"testUser"} })
        fireEvent.change(firstNameInput, {target: {value:"test"} });;
        fireEvent.change(lastNameInput, {target: {value:"User"} });
        fireEvent.change(emailInput, {target: {value:"User@example.org"} });
        fireEvent.change(passwordInput, {target: {value:"password123"} });
        fireEvent.change(confirmPasswordInput, {target: {value:"password123"} });

        expect(usernameInput.value).toBe("testUser");
        expect(firstNameInput.value).toBe("test");
        expect(lastNameInput.value).toBe("User");
        expect(emailInput.value).toBe("User@example.org");
        expect(passwordInput.value).toBe("password123");
        expect(confirmPasswordInput.value).toBe("password123");

    });

    it("should show terms and conditions", () => {
        render(
            <BrowserRouter> <Signup/> </BrowserRouter>
        );
        const TACcheckbox = screen.getByRole("checkbox");
        expect(TACcheckbox).not.toBeChecked();
        fireEvent.click(TACcheckbox);
        expect(TACcheckbox).toBeChecked();
        fireEvent.click(TACcheckbox);
        expect(TACcheckbox).not.toBeChecked();

    });

    it("should go to login page when the button is clicked", () => {
        render(
            <BrowserRouter> <Signup/> </BrowserRouter>
        );
        const loginButton =screen.getByText("Login");
        expect(loginButton).to.exist;
    });

    it("should go back to welcome page when the back button is clicked", () => {
        render(
            <BrowserRouter> <Signup/> </BrowserRouter>
        );
        const backButton =screen.getByText("Back");
        expect(backButton).to.exist;
    });

    it("should call the sign up user API when the form is submitted", async () => {
            signUpUser
        });

});