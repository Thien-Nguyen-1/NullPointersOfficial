import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import Settings from "../../pages/Settings";
import { AuthContext } from "../../services/AuthContext";
import * as api from "../../services/api";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../services/api", async () => {
  const actual = await vi.importActual("../../services/api");
  return {
    ...actual,
    fetchCompletedInteractiveContent: vi.fn(),
    changeUserPassword: vi.fn(),
    downloadCompletedTask: vi.fn(),
    deleteUserSettings: vi.fn()
  };
});

const mockUser = {
  first_name: "John",
  last_name: "Doe",
  username: "@johndoe",
  user_type: "service user"
};

const renderWithContext = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user: mockUser, updateUser: vi.fn() }}>
        <Settings />
      </AuthContext.Provider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem("token", "valid-token");
  api.fetchCompletedInteractiveContent.mockResolvedValue([]);
});

describe("Settings Component", () => {
  describe("Initial Render", () => {
    it("displays settings paget", async () => {
      api.fetchCompletedInteractiveContent.mockResolvedValue([
        {
          title: "Quiz 1",
          quiz_type: "multiple choice",
          viewed_at: new Date().toISOString(),
          content_id: "123"
        }
      ]);

      renderWithContext();
      expect(await screen.findByText("Welcome John Doe")).toBeInTheDocument();
      expect(await screen.findByText("Quiz 1")).toBeInTheDocument();
    });

    it("shows message when no completed content", async () => {
      api.fetchCompletedInteractiveContent.mockResolvedValue([]);
      renderWithContext();
      expect(await screen.findByText("No completed content yet.")).toBeInTheDocument();
    });

    it("error if getting content fails", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      api.fetchCompletedInteractiveContent.mockRejectedValue(new Error("Something went wrong"));
      renderWithContext();
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to fetch completed interactive content",
          expect.any(Error)
        );
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Password Change Form", () => {
    it("showserror if passwords dont match", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { container } = renderWithContext();
      const inputs = container.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: "oldpassword" } });
      fireEvent.change(inputs[1], { target: { value: "newpassword" } });
      fireEvent.change(inputs[2], { target: { value: "differentpassword" } });
      fireEvent.click(screen.getByText("Confirm Change"));
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("New passwords do not match. Please re-enter them.");
      });
      alertMock.mockRestore();
    });

    it("alerts when fields are empty", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { container } = renderWithContext();
      const inputs = container.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: "oldpassword" } });
      fireEvent.click(screen.getByText("Confirm Change"));
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("All fields are required.");
      });
      alertMock.mockRestore();
    });

    it("calls API ", async () => {
      api.changeUserPassword.mockResolvedValue({});
      const { container } = renderWithContext();
      const inputs = container.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: "oldpassword" } });
      fireEvent.change(inputs[1], { target: { value: "newpassword" } });
      fireEvent.change(inputs[2], { target: { value: "newpassword" } });
      fireEvent.click(screen.getByText("Confirm Change"));
      await waitFor(() => {
        expect(api.changeUserPassword).toHaveBeenCalledWith("oldpassword", "newpassword", "newpassword");
      });
    });

    it("alerts if API fails", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      api.changeUserPassword.mockRejectedValue(new Error("API error"));
      const { container } = renderWithContext();
      const inputs = container.querySelectorAll('input[type="password"]');
      fireEvent.change(inputs[0], { target: { value: "oldpassword" } });
      fireEvent.change(inputs[1], { target: { value: "newpassword" } });
      fireEvent.change(inputs[2], { target: { value: "newpassword" } });
      fireEvent.click(screen.getByText("Confirm Change"));
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Failed to change password, please try again.");
      });
      alertMock.mockRestore();
    });
  });

  describe("Download PDF", () => {
    beforeEach(() => {
      api.fetchCompletedInteractiveContent.mockResolvedValue([
        {
          title: "Quiz 1",
          quiz_type: "multiple choice",
          viewed_at: new Date().toISOString(),
          content_id: "123"
        }
      ]);
    });

    it("calls API ", async () => {
      renderWithContext();
      const downloadBtn = await screen.findByText("Download PDF");
      fireEvent.click(downloadBtn);
      await waitFor(() => {
        expect(api.downloadCompletedTask).toHaveBeenCalledWith("123", "valid-token");
      });
    });

    it("alerts if not authenticated", async () => {
      localStorage.removeItem("token");
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      renderWithContext();
      const downloadBtn = await screen.findByText("Download PDF");
      fireEvent.click(downloadBtn);
      expect(alertMock).toHaveBeenCalledWith("user isnt authenticated");
      alertMock.mockRestore();
    });

    it("alerts when task has no questions", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const mockError = {
        response: {
          status: 400,
          data: new Blob([JSON.stringify({ error: "No questions found for this task" })], {
            type: "application/json"
          })
        }
      };
      mockError.response.data.text = async () => JSON.stringify({ error: "No questions found for this task" });
      api.downloadCompletedTask.mockRejectedValue(mockError);
      renderWithContext();
      const downloadBtn = await screen.findByText("Download PDF");
      fireEvent.click(downloadBtn);
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          "This task has no questions/answers and cannot be downloaded as a PDF."
        );
      });
      alertMock.mockRestore();
    });
    it("alerts 'Error downloading PDF' if error", async () => {
        const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
        const blob = new Blob([JSON.stringify({ error: "Different error" })], {
          type: "application/json"
        });
        blob.text = async () => JSON.stringify({ error: "Different error" });
      
        const mockError = {
          response: {
            status: 400,
            data: blob
          }
        };
      
        api.downloadCompletedTask.mockRejectedValue(mockError);
      
        renderWithContext();
        const downloadBtn = await screen.findByText("Download PDF");
        fireEvent.click(downloadBtn);
      
        await waitFor(() => {
          expect(alertMock).toHaveBeenCalledWith("Error downloading PDF");
        });
      
        alertMock.mockRestore();
      });

      it("alerts and logs if response contains error", async () => {
        const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
        const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});
      
        const badBlob = new Blob(["not-json"], { type: "application/json" });
        badBlob.text = async () => "not-json"; 
      
        const mockError = {
          response: {
            status: 500,
            data: badBlob
          }
        };
      
        api.downloadCompletedTask.mockRejectedValue(mockError);
      
        renderWithContext();
        const downloadBtn = await screen.findByText("Download PDF");
        fireEvent.click(downloadBtn);
      
        await waitFor(() => {
          expect(alertMock).toHaveBeenCalledWith("Error downloading PDF");
          expect(consoleErrorMock).toHaveBeenCalledWith("Unhandled error:", expect.any(SyntaxError));
        });
      
        alertMock.mockRestore();
        consoleErrorMock.mockRestore();
      });
      
      
  });

  describe("Delete Account Flow", () => {
    it("opens and confirms delete modal", async () => {
      api.deleteUserSettings.mockResolvedValue({});
      renderWithContext();
      fireEvent.click(screen.getByText("Delete Account"));
      expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Confirm Delete"));
      await waitFor(() => {
        expect(api.deleteUserSettings).toHaveBeenCalled();
      });
    });

    it("closes modal on cancel", async () => {
      renderWithContext();
      fireEvent.click(screen.getByText("Delete Account"));
      fireEvent.click(screen.getByText("Cancel"));
      await waitFor(() => {
        expect(screen.queryByText("Confirm Deletion")).not.toBeInTheDocument();
      });
    });

    it("alerts if user data is missing", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      render(
        <MemoryRouter>
          <AuthContext.Provider value={{ user: null, updateUser: vi.fn() }}>
            <Settings />
          </AuthContext.Provider>
        </MemoryRouter>
      );
      fireEvent.click(screen.getByText("Delete Account"));
      fireEvent.click(screen.queryByText("Confirm Delete"));
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("User data not loaded");
      });
      alertMock.mockRestore();
    });

    it("alerts if deletion fails", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      api.deleteUserSettings.mockRejectedValue(new Error("Delete failed"));
      renderWithContext();
      fireEvent.click(screen.getByText("Delete Account"));
      fireEvent.click(screen.getByText("Confirm Delete"));
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith("Failed to delete account.");
      });
      alertMock.mockRestore();
    });
  });
});
