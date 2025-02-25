import React from "react";
import {render, screen, fireEvent} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it ,expect, vi } from "vitest";
import ChangePassword from "../components/ChangePassword";

describe("Chnage password component", () => {
    it("Should render the correct change password form" , () => {
        render(
            <BrowserRouter> <ChangePassword/> </BrowserRouter>
        );
        expect(screen.getByPlaceholderText("Username")).to.exist;
        expect(screen.getByPlaceholderText("New Password")).to.exist;
        expect(screen.getByPlaceholderText("Confirm New Password")).to.exist;
        expect(screen.getByRole("button", {name: "Reset Password"})).to.exist;
    });

    it("Should update fields on change", () => {
        render(
            <BrowserRouter> <ChangePassword/> </BrowserRouter>
        );
        const usernameInput =screen.getByPlaceholderText("Username");
        const newPasswordInput =screen.getByPlaceholderText("New Password");
        const confirmNewPasswordInput =screen.getByPlaceholderText("Confirm New Password");

        fireEvent.change(usernameInput, {target: {value:"testUser"} })
        fireEvent.change(newPasswordInput, {target: {value:"password123"} });
        fireEvent.change(confirmNewPasswordInput, {target: {value:"password123"} });

        expect(usernameInput.value).toBe("testUser");
        expect(newPasswordInput.value).toBe("password123");
        expect(confirmNewPasswordInput.value).toBe("password123");

    });
});