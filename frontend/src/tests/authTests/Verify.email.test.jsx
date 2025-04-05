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
});

describe("VerifyEmail component", () => {
    it("renders initial verification message", () => {
      render(<VerifyEmail />);
      expect(screen.getByText("Verifying...")).toBeInTheDocument();
    });
  
    it("shows success message and navigates to /login on successful verification", async () => {
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
  
    it("shows fallback message and navigates to /login on failed verification", async () => {
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
  