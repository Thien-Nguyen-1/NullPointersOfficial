import { test, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Settings from "../pages/Settings";
import { getUserSettings, deleteUserSettings, changeUserPassword } from "../services/api";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/api", () => ({
    getUserSettings: vi.fn(),
    deleteUserSettings: vi.fn(),
    changeUserPassword: vi.fn(),
}));

beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {}); 
});

afterEach(() => {
    vi.restoreAllMocks(); 
});

test("get and display user settings", async() => {
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });

    render(
        <MemoryRouter>
            <Settings/>
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText(/Welcome, John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Username:/i)).toBeInTheDocument();
        expect(screen.getByText(/@johndoe/i)).toBeInTheDocument();
    });
});

test("chnages password", async() => {
    getUserSettings.mockResolvedValue({
        user_type: "service user",
    });
    changeUserPassword.mockResolvedValue({
        message: "Password updated successfully",
    });
    render(
        <MemoryRouter>
            <Settings/>
        </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Old Password:/i), {target: {value: "password"}});
    fireEvent.change(screen.getByLabelText(/^New Password:$/i), {target: {value: "password1"}});
    fireEvent.change(screen.getByLabelText(/^Confirm New Password:$/i), {target: {value: "password1"}});

    await act(async() => fireEvent.click(screen.getByText(/Confirm change/i)));

    await waitFor(()=> {
        expect(window.alert).toHaveBeenCalledWith("Password updated successfully.");
    });
});

test("shows alert if missing fields when changing password", async () => {
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });
    render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );

    await act(async () => fireEvent.click(screen.getByText(/Confirm change/i)));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("All fields are required.");
    });
});

test("shows alert if new passwords do not match", async () => {
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });
    render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Old Password:/i), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText(/^New Password:$/i), { target: { value: "password1" } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password:$/i), { target: { value: "password2" } });

    await act(async () => fireEvent.click(screen.getByText(/Confirm change/i)));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("New passwords do not match. Please re-enter them.");
    });
});

test("shows alert if password change API fails", async () => {
    changeUserPassword.mockRejectedValue(new Error("Failed to change password"));
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });

    render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Old Password:/i), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText(/^New Password:$/i), { target: { value: "password1" } });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password:$/i), { target: { value: "password1" } });

    await act(async () => fireEvent.click(screen.getByText(/Confirm change/i)));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Failed to change password, please try again.");
    });
});

test("clicking delete accpunt button opens confirmation modal", async () => {
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });
    render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );

    expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Delete Account/i));

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
});

test("clicking cancel closes the deletion modal", async () => {
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });
    render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Delete Account/i));
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancel/i));

    await waitFor(() => {
        expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();
    });
});


test("shows alert if account deletion API fails", async () => {
    deleteUserSettings.mockRejectedValue(new Error("Failed to delete account"));
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
        username: "@johndoe"
    });

    render(
        <MemoryRouter>
            <Settings />
        </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Delete Account/i));
    fireEvent.click(screen.getByText(/Confirm Delete/i));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Failed to delete account");
    });
});
