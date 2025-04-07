
import { fireEvent, render, screen, waitFor, cleanup, act } from "@testing-library/react";
import { createEvent } from "@testing-library/react";
import { afterEach, beforeEach, expect } from "vitest";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";

import MessageBar from "../../components/SupportAssets/MessageBar";
import { AuthContext } from "../../services/AuthContext";


const mockFile = new File(["hello"], "test.png", { type: "image/png" });


test("manually triggers file upload flow", async () => {
    const sendNewMessageMock = vi.fn();
  
    await act(async () => {
      render(
        <AuthContext.Provider value={MockUserAuthContext}>
          <MessageBar
            sendNewMessage={sendNewMessageMock}
            convObj={{
              id: 1,
              title: "Test Conversation",
              updated_at: "2024-04-04T12:00:00.000Z",
              hasEngaged: true,
              user_username: "@user",
              admin: 1,
            }}
          />
        </AuthContext.Provider>
      );
    });
  
    const mockFile = new File(["hello"], "test.png", { type: "image/png" });
  
    const dropInput = document.querySelector(".input-zone");
    expect(dropInput).toBeInTheDocument();
  
    await act(async () => {
      fireEvent.change(dropInput, {
        target: { files: [mockFile] },
      });
    });
  
    await waitFor(() => {
      expect(sendNewMessageMock).toHaveBeenCalledWith({
        message: "UPLOADING FILE",
        file: mockFile,
      });
    });
  });