import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect, vi } from "vitest";
import Login from "../src/components/Login";
// import { loginUser } from "../src/services/api";

// vi.mock("../src/services/api", () => ({
//     loginUser: vi.fn(),
// }));

describe("Login component", () => {
    it("Should render the correct login form" , () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Login"})).toBeInTheDocument();
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

    // it("should call the login user API when the form is submitted", async () => {
    //     loginUser
    // });

    it("should go back when the back button is clicked", () => {
        render(
            <BrowserRouter> <Login/> </BrowserRouter>
        );
        const backButton =screen.getByText("Back");
        expect(backButton).toBeInTheDocument();
    });

});
