import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CourseItem from "../../components/CourseItem";
import { AuthContext } from "../../services/AuthContext";
import { EnrollmentContext } from "../../services/EnrollmentContext";
import * as api from "../../services/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});


vi.mock("../../services/api", () => {
    const mockTags = [
      { id: 1, tag: "React" },
      { id: 2, tag: "Testing" },
    ];

    const mockGetById = vi.fn((id) =>
        Promise.resolve({ data: mockTags.find((tag) => tag.id === id) })
      );
  
    return {
      tagApi: {
        getById: mockGetById,
      },
      __mockGetById: mockGetById,
    };
  });;
  

describe("CourseItem Component", () => {
  const baseProps = {
    module: {
      id: 1,
      title: "Sample Course",
      upvotes: 10,
      tags: [1, 2],
    },
    role: "worker",
    update_interact_module: vi.fn(),
  };

  const renderComponent = (authValue, enrollmentValue, props = {}) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <EnrollmentContext.Provider value={enrollmentValue}>
          <MemoryRouter>
            <CourseItem {...baseProps} {...props} />
          </MemoryRouter>
        </EnrollmentContext.Provider>
      </AuthContext.Provider>
    );
  };

  it("renders course title and tags", async () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false });
    expect(screen.getByText("Sample Course")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Testing")).toBeInTheDocument();
    });
  });

  it("shows pin icon and toggles it", async () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false });
    const pinButton = screen.getByTestId("pin-btn");
    await act(() => fireEvent.click(pinButton));
    expect(baseProps.update_interact_module).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ hasPinned: true })
    );
  });

  it("shows edit button only for admin", () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false }, { role: "admin" });
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("hides edit button for normal users", () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false });
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("opens enrollment modal if not enrolled", async () => {
    renderComponent({ user: { id: 1 }, token: "abc" }, { isEnrolled: () => false });
    await act(() => fireEvent.click(screen.getByText("View Course")));
    expect(screen.getByText((content) => /Enrol Me/i.test(content))).toBeInTheDocument();
  });

  it("closes modal when onClose is called", async () => {
    renderComponent({ user: { id: 1 }, token: "abc" }, { isEnrolled: () => false });
    await act(() => fireEvent.click(screen.getByText("View Course")));
    const closeButton = screen.getByText("×");
    await act(() => fireEvent.click(closeButton));
    await waitFor(() => {
        expect(screen.queryByText("Enrol Me")).not.toBeInTheDocument();
      }); // Modal should be removed
  });

  it("navigates directly if enrolled or admin", async () => {
    renderComponent({ user: { id: 1 }, token: "abc" }, { isEnrolled: () => true });
    await act(() => fireEvent.click(screen.getByText("Continue Learning")));
    expect(mockNavigate).toHaveBeenCalledWith("/modules/1");
  });

  it("navigates to edit page on edit button click", async () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false }, { role: "admin" });
    await act(() => fireEvent.click(screen.getByText("Edit")));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/admin/all-courses/create-and-manage-module?edit=1"
    );
  });

  it("falls back to worker if no role is provided", async () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false }, { role: undefined });
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("handles tag fetching error gracefully", async () => {
    api.__mockGetById.mockImplementationOnce(() => Promise.reject(new Error("Failed")));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false });
    await waitFor(() => {
        expect(spy).toHaveBeenCalledWith("Failed to fetch tags:", expect.any(Error));
    });
    spy.mockRestore();
  });

  it("handles missing module id safely in modal", async () => {
    const props = {
      module: {
        ...baseProps.module,
        id: null,
      },
    };
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false }, props);
    expect(screen.getByText("Sample Course")).toBeInTheDocument();
  });

  it("loads userInteractTarget state on mount", async () => {
    const mockUpdate = vi.fn();
  
    renderComponent(
      { user: {}, token: "abc" },
      { isEnrolled: () => false },
      {
        update_interact_module: mockUpdate,
        userInteractTarget: { hasPinned: false }, // initial state
      }
    );
  
    const pinBtn = screen.getByTestId("pin-btn");
    await act(() => fireEvent.click(pinBtn));
  
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ hasPinned: true }) // toggled result
    );
  });

  it("enrolls in a course and navigates on success", async () => {
    const mockEnroll = vi.fn(() => Promise.resolve());
  
    renderComponent(
      { user: { id: 1 }, token: "abc" },
      { isEnrolled: () => false, enrollInModule: mockEnroll },
      {
        role: "worker",
        update_interact_module: vi.fn(),
        module: { id: 1, title: "Sample Course", upvotes: 10, tags: [] }
      }
    );
  
    await act(() => fireEvent.click(screen.getByText("View Course")));
    await act(() => fireEvent.click(screen.getByText("Enrol Me")));
  
    expect(mockEnroll).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith("/modules/1");
  });

  it("shows error and alert if enrollment fails", async () => {
    const mockEnroll = vi.fn(() => Promise.reject(new Error("Enrollment failed")));
    const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const mockConsole = vi.spyOn(console, "error").mockImplementation(() => {});
  
  
    const { default: CourseItem } = await import("../../components/CourseItem");
  
    // Use your existing helper
    renderComponent(
      { user: { id: 1 }, token: "abc" },
      { isEnrolled: () => false, enrollInModule: mockEnroll },
      { update_interact_module: vi.fn(), module: { id: 1, title: "Sample Course", tags: [] } }
    );
  
    await act(() => fireEvent.click(screen.getByText("View Course")));
    await act(() => fireEvent.click(screen.getByText("Enrol Me")));
  
    expect(mockEnroll).toHaveBeenCalledWith(1);
    expect(mockConsole).toHaveBeenCalledWith("Error enrolling in course:", expect.any(Error));
    expect(mockAlert).toHaveBeenCalledWith("Failed to enroll in course. Please try again later.");
  
    mockAlert.mockRestore();
    mockConsole.mockRestore();
  });
});
