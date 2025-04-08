import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import ServiceUsersPage from "../../pages/ServiceUsersPage";
import * as api from "../../services/api";

vi.mock("../../services/api", async () => {
  const actual = await vi.importActual("../../services/api");
  return {
    ...actual,
    fetchServiceUsers: vi.fn(),
    deleteServiceUser: vi.fn(),
  };
});
const mockUsers = [
  {
    user_id: 1,
    username: "user1",
    first_name: "Alice",
    last_name: "Smith",
    tags: ["support", "priority"]
  },
  {
    user_id: 2,
    username: "user2",
    first_name: "Bob",
    last_name: "Brown",
    tags: []
  }
];

describe("ServiceUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", async () => {
    api.fetchServiceUsers.mockReturnValue(new Promise(() => {})); 
    render(<ServiceUsersPage />);
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    api.fetchServiceUsers.mockRejectedValue(new Error("Fetch failed"));
    render(<ServiceUsersPage />);
    await waitFor(() => {
      expect(screen.getByText("Error: Fetch failed")).toBeInTheDocument();
    });
  });

  it("displays empty state when no users", async () => {
    api.fetchServiceUsers.mockResolvedValue([]);
    render(<ServiceUsersPage />);
    await waitFor(() => {
      expect(screen.getByText("No service users registered yet.")).toBeInTheDocument();
    });
  });

  it("displays users in a table", async () => {
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    render(<ServiceUsersPage />);
    expect(await screen.findByText("user1")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Smith")).toBeInTheDocument();
    expect(screen.getByText("No tags")).toBeInTheDocument(); // user2
  });

  it("filters users by search query", async () => {
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    render(<ServiceUsersPage />);
    await screen.findByText("user1");

    fireEvent.change(screen.getByPlaceholderText("Search by username..."), {
      target: { value: "user2" },
    });

    expect(screen.queryByText("user1")).not.toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  it("shows no results when filter doesn't match", async () => {
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    render(<ServiceUsersPage />);
    await screen.findByText("user1");

    fireEvent.change(screen.getByPlaceholderText("Search by username..."), {
      target: { value: "nonexistent" },
    });

    expect(
      screen.getByText(
        'All 2 records of service users searched: None found with username "nonexistent"'
      )
    ).toBeInTheDocument();
  });

  it("clears the search input", async () => {
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    render(<ServiceUsersPage />);
    await screen.findByText("user1");

    const searchInput = screen.getByPlaceholderText("Search by username...");
    fireEvent.change(searchInput, { target: { value: "user1" } });
    expect(searchInput.value).toBe("user1");

    const clearBtn = screen.getByLabelText("Clear search");
    fireEvent.click(clearBtn);
    expect(searchInput.value).toBe("");
    expect(await screen.findByText("user1")).toBeInTheDocument();
  });

  it("deletes a user after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    api.deleteServiceUser.mockResolvedValue({});

    render(<ServiceUsersPage />);
    await screen.findByText("user1");

    const deleteBtn = screen.getByLabelText("Delete user user1");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteServiceUser).toHaveBeenCalledWith("user1");
    });

    expect(screen.queryByText("user1")).not.toBeInTheDocument();
    expect(screen.getByText('User with username "user1" has been deleted.')).toBeInTheDocument();
  });

  it("does not delete user if confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    render(<ServiceUsersPage />);
    await screen.findByText("user1");

    const deleteBtn = screen.getByLabelText("Delete user user1");
    fireEvent.click(deleteBtn);

    expect(api.deleteServiceUser).not.toHaveBeenCalled();
    expect(screen.getByText("user1")).toBeInTheDocument();
  });

  it("shows error message if deletion fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    api.deleteServiceUser.mockRejectedValue(new Error("Delete failed"));

    render(<ServiceUsersPage />);
    await screen.findByText("user1");

    const deleteBtn = screen.getByLabelText("Delete user user1");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
        expect(
          screen.getByText((content) =>
            content.includes("Failed to delete user.")
          )
        ).toBeInTheDocument();
      });
      
  });

  it("displays and clears the success message after user deletion", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.fetchServiceUsers.mockResolvedValue(mockUsers);
    api.deleteServiceUser.mockResolvedValue({});
  
    render(<ServiceUsersPage />);
    await screen.findByText("user1");
    fireEvent.click(screen.getByLabelText("Delete user user1"));
    await waitFor(() => {
      expect(
        screen.getByText((content) =>
          content.includes('User with username "user1" has been deleted.')
        )
      ).toBeInTheDocument();
    });
  
    const closeBtn = screen.getByLabelText("Close notification");
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(
        screen.queryByText((content) =>
          content.includes('User with username "user1" has been deleted.')
        )
      ).not.toBeInTheDocument();
    });
  });
  it("sets users to [] if fetchServiceUsers returns non-array data", async () => {
    api.fetchServiceUsers.mockResolvedValue(null); 
  
    render(<ServiceUsersPage />);
  
    await waitFor(() => {
      expect(
        screen.getByText("No service users registered yet.")
      ).toBeInTheDocument();
    });
  });
  
  
});
