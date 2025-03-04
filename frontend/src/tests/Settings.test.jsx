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

test("get and display user settings", async() => {
    getUserSettings.mockResolvedValue({
        first_name: "John",
        last_name: "Doe",
        user_id: "1",
        user_type: "service user",
    });

    render(
        <MemoryRouter>
            <Settings/>
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText(/Welcome, John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/User Id: 1/i)).toBeInTheDocument();
    });
});

// test("chnages password", async() => {
//     getUserSettings.mockResolvedValue({
//         user_type: "service user",
//     });
//     changeUserPassword.mockResolvedValue({
//         message: "Password updated successfully",
//     });
//     render(
//         <MemoryRouter>
//             <Settings/>
//         </MemoryRouter>
//     );
//     fireEvent.change(screen.getByPlaceholderText(/Old Password/i), {target: {value: "oldpassword"}});
//     fireEvent.change(screen.getByLabelText(/New Password/i), {target: {value: "newpassword"}});
//     fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {target: {value: "newpassword"}});

//     await act(async() => fireEvent.click(screen.getByText(/Change Password/i)));

//     await waitFor(()=> {
//         expect(window.alert).toHaveBeenCalledWith("Password updated successfully");
//     });
// });