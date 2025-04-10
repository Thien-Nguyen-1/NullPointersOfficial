import { render, screen } from "@testing-library/react";
import StatsCards from "../../components/StatsCards";

describe("StatsCards", () => {
  const defaultProps = {
    userName: "Tawye",
    completedModules: 5,
    inProgressModules: 2,
  };

  it("renders greeting with the user's name", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText(/Welcome, Tawye!/i)).toBeInTheDocument();
    expect(screen.getByText(/It's good to see you again./i)).toBeInTheDocument();
  });

  it("displays number of completed courses", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/Courses completed/i)).toBeInTheDocument();
  });

  it("displays number of courses in progress", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/Courses in progress/i)).toBeInTheDocument();
  });

  it("renders correctly with 0 values", () => {
    render(<StatsCards userName="@Alex" completedModules={0} inProgressModules={0} />);
    
    const zeroCounts = screen.getAllByText("0");
    expect(zeroCounts).toHaveLength(2); // One for each stat
  
    expect(screen.getByText(/Courses completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Courses in progress/i)).toBeInTheDocument();
  });
});
