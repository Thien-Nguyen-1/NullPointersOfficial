/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ⛔️ Important: mock recharts BEFORE importing LearningChart
vi.mock("recharts", () => ({
  LineChart: ({ children }) => <svg data-testid="mock-line-chart">{children}</svg>,
  Line: () => <line />,
  XAxis: () => <g />,
  YAxis: () => <g />,
  CartesianGrid: () => <g />,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

import LearningChart from "../../components/LearningChart";

const mockData = [
  { day: "Mon", hours: 1 },
  { day: "Tue", hours: 2 },
  { day: "Wed", hours: 3 },
  { day: "Thu", hours: 2 },
  { day: "Fri", hours: 1 },
];

describe("LearningChart", () => {
  it("renders chart title", () => {
    render(<LearningChart data={mockData} />);
    expect(screen.getByText("Your Learning Hours")).toBeInTheDocument();
  });

  it("renders mocked line chart", () => {
    render(<LearningChart data={mockData} />);
    expect(screen.getByTestId("mock-line-chart")).toBeInTheDocument();
  });
});
