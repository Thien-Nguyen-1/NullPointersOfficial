// src/tests/components/CoursesTagList.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CoursesTagList from "../../components/CoursesTagList";

// Dummy function for setSelectedTag.
const setSelectedTagMock = vi.fn();

describe("CoursesTagList", () => {
  beforeEach(() => {
    setSelectedTagMock.mockClear();
  });

  // --- Message Tests ---
  it("renders correct message when tags exist and isUser is true with one tag", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    expect(screen.getByRole("heading", { name: /Tags/i })).toBeInTheDocument();
    expect(screen.getByText(/You have/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    // Verify that the message ends with "tag"
    expect(screen.getByText((text) => text.trim().endsWith("tag"))).toBeInTheDocument();
  });

  it("renders correct message when tags exist and isUser is true with multiple tags", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }, { id: 2, tag: "Tag2" }]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    expect(screen.getByText(/You have/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText((text) => text.trim().endsWith("tags"))).toBeInTheDocument();
  });

  it("renders correct message when tags exist and isUser is false with one tag", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    expect(screen.getByText(/There is/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText((text) => text.trim().endsWith("tag created"))).toBeInTheDocument();
  });

  it("renders correct message when tags exist and isUser is false with multiple tags", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }, { id: 2, tag: "Tag2" }]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    expect(screen.getByText(/There are/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText((text) => text.trim().endsWith("tags created"))).toBeInTheDocument();
  });

  it("renders correct message when there are no tags and isUser is true", () => {
    render(
      <CoursesTagList 
        tags={[]} 
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    expect(screen.getByText(/You have/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders correct message when there are no tags and isUser is false", () => {
    render(
      <CoursesTagList 
        tags={[]} 
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    expect(screen.getByText(/There are/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // --- Interaction Tests for Tag Selection ---
  it("calls setSelectedTag with null when the 'All' button is clicked", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }]}
        selectedTag={2}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    const allButton = screen.getByText("All");
    fireEvent.click(allButton);
    expect(setSelectedTagMock).toHaveBeenCalledWith(null);
  });

  it("calls setSelectedTag with the specific tag id when a tag button is clicked", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }, { id: 2, tag: "Tag2" }]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    const tagButton = screen.getByText("Tag2");
    fireEvent.click(tagButton);
    expect(setSelectedTagMock).toHaveBeenCalledWith(2);
  });

  // --- Edit Button Test ---
  it("renders an edit button when isUser is false", () => {
    render(
      <CoursesTagList 
        tags={[{ id: 1, tag: "Tag1" }]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    const editButton = screen.getByTestId("edit-button");
    expect(editButton).toBeInTheDocument();
  });
});
