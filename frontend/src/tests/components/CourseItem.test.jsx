import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CourseItem from "../../components/CourseItem";
import { AuthContext } from "../../services/AuthContext";
import { EnrollmentContext } from "../../services/EnrollmentContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTags = [
  { id: 1, tag: "React" },
  { id: 2, tag: "Testing" },
];

vi.mock("../../services/api", () => ({
  tagApi: {
    getById: vi.fn((id) => Promise.resolve({ data: mockTags.find(t => t.id === id) })),
  },
}));

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
    fireEvent.click(pinButton);
    expect(baseProps.update_interact_module).toHaveBeenCalledWith(1, expect.objectContaining({ hasPinned: true }));
  });

  it("shows edit button only for admin", () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false }, { role: "admin" });
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("hides edit button for normal users", () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => false });
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("opens enrollment modal if not enrolled", () => {
    renderComponent({ user: { id: 1 }, token: "abc" }, { isEnrolled: () => false });
    fireEvent.click(screen.getByText("View Course"));
    expect(screen.getByText("View Course")).toBeInTheDocument();
    expect(screen.getByText(/enroll/i)).toBeInTheDocument();
  });

  it("navigates directly if enrolled or admin", () => {
    renderComponent({ user: { id: 1 }, token: "abc" }, { isEnrolled: () => true });
    fireEvent.click(screen.getByText("Continue Learning"));
    expect(mockNavigate).toHaveBeenCalledWith("/modules/1");
  });

  it("updates like state and counter", () => {
    renderComponent({ user: {}, token: "abc" }, { isEnrolled: () => true }, {
      userInteractTarget: { hasLiked: false, hasPinned: false },
    });
    const button = screen.getByText("Continue Learning").parentElement.previousSibling;
    fireEvent.click(button);
    expect(baseProps.update_interact_module).toHaveBeenCalledWith(1, expect.objectContaining({ hasLiked: true }));
  });
});
