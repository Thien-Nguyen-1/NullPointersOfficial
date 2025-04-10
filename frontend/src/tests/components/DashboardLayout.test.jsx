import { render, screen, waitFor } from "@testing-library/react";
import DashboardLayout from "../../components/DashboardLayout";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// Mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to mock localStorage
const setMockLocalStorage = (value) => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn(() => JSON.stringify(value)),
  });
};

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to home if no user_type is present", async () => {
    setMockLocalStorage({}); // No user_type
    render(
      <MemoryRouter>
        <DashboardLayout>
          <p>Protected Content</p>
        </DashboardLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("renders sidebar and content for worker", async () => {
    setMockLocalStorage({ user_type: "worker" });

    render(
      <MemoryRouter>
        <DashboardLayout>
          <p>Protected Content</p>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(await screen.findByText("Protected Content")).toBeInTheDocument();
  });

  it("renders sidebar and content for admin", async () => {
    setMockLocalStorage({ user_type: "admin" });

    render(
      <MemoryRouter>
        <DashboardLayout>
          <p>Admin Area</p>
        </DashboardLayout>
      </MemoryRouter>
    );

    expect(await screen.findByText("Admin Area")).toBeInTheDocument();
  });

  it("handles JSON parse error gracefully", async () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "{bad_json"),
    });

    render(
      <MemoryRouter>
        <DashboardLayout>
          <p>Should not render</p>
        </DashboardLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
