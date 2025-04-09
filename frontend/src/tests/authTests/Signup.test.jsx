import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Signup from "../../components/auth/SignUp";
import { AuthContext } from "../../services/AuthContext";
import api from "../../services/api";

const mockSignUpUser = vi.fn();
vi.mock("../../services/api", async (importActual) => {
    const actual = await importActual();
    return {
      ...actual,
      default: {
        ...actual.default,
        get: vi.fn().mockResolvedValue({ data: { content: "<p>Mock T&Cs</p>" } }),
      },
    };
  });

 
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const customRender = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={providerProps}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>,
    renderOptions
  );
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    json: async () => ({ exists: false }) 
  }));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Signup component", () => {
  it("renders form fields and buttons", () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("updates input fields on change", () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@testUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });

    expect(screen.getByPlaceholderText("Username").value).toBe("@testUser");
    expect(screen.getByPlaceholderText("Email").value).toBe("user@example.com");
  });

  it("shows and hides Terms and Conditions modal", async () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.click(screen.getByText("Terms and Conditions", { selector: 'span' }));

    expect(await screen.findByRole("heading", { name: /terms and conditions/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText("I Accept"));
    expect(screen.queryByRole("heading", { name: /terms and conditions/i })).not.toBeInTheDocument();
  });

  it("shows error when username does not start with @", async () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });
  
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "testUser" }, 
    });
    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("checkbox")); 
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
  
    await waitFor(() => {
      expect(
        screen.getByText("Username must start with '@'.")
      ).toBeInTheDocument();
    });
  });
  
  

  it("shows error when passwords do not match", async () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });
  
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "@testUser" },
    });
    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("checkbox")); 
  
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
  
    await waitFor(() => {
      expect(
        screen.getByText("Passwords do not match.")
      ).toBeInTheDocument();
    });
  });
  
  it("shows error when username is too short", async () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@a" } }); 
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "short@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox")); 

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("Username must be longer than 3 characters.")).toBeInTheDocument();
    });
  });

  it("shows error when username is already taken", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({ exists: true }) 
    }));

    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@takenUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "taken@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox")); 

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("This username is already taken, please choose another.")).toBeInTheDocument();
    });
  });

  it("shows error when email is already taken", async () => {
    vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ json: async () => ({ exists: false }) }) // username check
    .mockResolvedValueOnce({ json: async () => ({ exists: true }) })  // email check
  );

    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@takenUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "taken@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox")); 

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByText("This email is already registered to a user, please choose another.")).toBeInTheDocument();
    });
  });


  it("prevents submission without accepting T&Cs", async () => {
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@testUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText(/you must accept/i)).toBeInTheDocument();
  });

  it("calls SignUpUser if all fields are valid", async () => {
    mockSignUpUser.mockResolvedValueOnce({ message: "Success" });

    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@testUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });

    fireEvent.click(screen.getByRole("checkbox")); 
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(mockSignUpUser).toHaveBeenCalled();
    });
  });

  it("displays error when SignUpUser throws error", async () => {
    mockSignUpUser.mockRejectedValueOnce(new Error("Signup failed"));

    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });

    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@testUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });

    fireEvent.click(screen.getByRole("checkbox")); 
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText(/signup failed/i)).toBeInTheDocument();
  });

  it("shows error if username check fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network error")));
  
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });
  
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@failUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Fail" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "fail@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox"));
  
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
  
    await waitFor(() => {
      expect(
        screen.getByText("This username is already taken, please choose another.")
      ).toBeInTheDocument();
    });
  });

  it("shows error if email check fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({ json: async () => ({ exists: false }) }) 
    .mockRejectedValueOnce(new Error("Network error"))                 
    );
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });
  
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "@failUser" } });
    fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "Fail" } });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "User" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "fail@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "123456" } });
    fireEvent.change(screen.getByPlaceholderText("Confirm Password"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox"));
  
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
  
    await waitFor(() => {
      expect(
        screen.getByText("This email is already registered to a user, please choose another.")
      ).toBeInTheDocument();
    });
  });

  
  it("shows fallback content if terms and conditions fetch fails", async () => {
    api.get.mockRejectedValueOnce(new Error("API failure")); 
  
    customRender(<Signup />, { providerProps: { SignUpUser: mockSignUpUser } });
  
    fireEvent.click(screen.getByText("Terms and Conditions", { selector: "span" }));
  
    expect(
      await screen.findByText("Terms and conditions could not be loaded. Please try again later.")
    ).toBeInTheDocument();
  });

  it("navigates to login and home when respective buttons are clicked", async () => {
    
    const { default: SignupComponent } = await import("../../components/auth/SignUp");
  
    customRender(<SignupComponent />, {
      providerProps: { SignUpUser: mockSignUpUser },
    });
  
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  
});


