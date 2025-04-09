import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VerifyEmail from "../../components/auth/VerifyEmail"; 
import { useNavigate, useParams } from "react-router-dom";


const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ token: "test-token" }),
    useNavigate: () => mockNavigate,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = undefined; 
});

describe("VerifyEmail component", () => {
  it("shows initial verification message", async () => {
    global.fetch = vi.fn(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ detail: "Success" }),
          });
        }, 10);
      })
    );

    render(<VerifyEmail />);
    const message = await screen.findByText("Verifying...");
    expect(message).toBeInTheDocument();
  });
  
    it("shows success message and goes to login page on successful verification", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ detail: "Success" }),
      });
  
      render(<VerifyEmail />);
  
      await waitFor(() => {
        expect(screen.getByText("Email verified successfully! Redirecting...")).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  
    it("shows fallback message and goes to login page", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: "Invalid or expired token" }),
      });
  
      render(<VerifyEmail />);
  
      await waitFor(() => {
        expect(screen.getByText("Loading log in page...")).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  
    it("shows error message when fetch throws", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
  
      render(<VerifyEmail />);
  
      await waitFor(() => {
        expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

// describe.skip('some test suite', () => {
//   test('will not run', () => {
//     expect(true).toBe(false);
//   });
// });
  