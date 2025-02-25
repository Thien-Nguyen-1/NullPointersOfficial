import React from "react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect } from "vitest";
import Welcome from "../components/Welcome";
import {render, screen} from "@testing-library/react";

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
});