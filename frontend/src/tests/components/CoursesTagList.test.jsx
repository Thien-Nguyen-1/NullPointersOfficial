import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CourseTagsList from "../../components/CourseTagsList";

// The component uses CSS modules (imported as styles) and react-icons (GrAdd)
// No special mocks are required for these since their output is not affecting our logic.

// We'll pass down a dummy function for setSelectedTag.
describe("CourseTagsList", () => {
  let setSelectedTagMock;
  
  beforeEach(() => {
    setSelectedTagMock = vi.fn();
  });
  
  // --- Message tests ---
  it("renders correct message when tags exist and isUser is true with one tag", () => {
    render(
      <CourseTagsList 
        tags={[{ id: 1, tag: "Tag1" }]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    // For isUser === true and one tag, message should be "You have 1 tag"
    expect(screen.getByText(/You have/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/tag$/i)).toBeInTheDocument();
  });
  
  it("renders correct message when tags exist and isUser is true with multiple tags", () => {
    render(
      <CourseTagsList 
        tags={[{ id: 1, tag: "Tag1" }, { id: 2, tag: "Tag2" }]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    // Expect "You have 2 tags"
    expect(screen.getByText(/You have/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/tags$/i)).toBeInTheDocument();
  });
  
  it("renders correct message when tags exist and isUser is false with one tag", () => {
    render(
      <CourseTagsList 
        tags={[{ id: 1, tag: "Tag1" }]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    // For isUser false and one tag, message should be "There is 1 tag created"
    expect(screen.getByText(/There is/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/tag created$/i)).toBeInTheDocument();
  });
  
  it("renders correct message when tags exist and isUser is false with multiple tags", () => {
    render(
      <CourseTagsList 
        tags={[{ id: 1, tag: "Tag1" }, { id: 2, tag: "Tag2" }]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    // Expect "There are 2 tags created"
    expect(screen.getByText(/There are/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/tags created$/i)).toBeInTheDocument();
  });
  
  it("renders correct message when no tags exist and isUser is true", () => {
    render(
      <CourseTagsList 
        tags={[]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    // Expect "You have 0 tags"
    expect(screen.getByText(/You have/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
  
  it("renders correct message when no tags exist and isUser is false", () => {
    render(
      <CourseTagsList 
        tags={[]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    // Expect "There are 0 tags created"
    expect(screen.getByText(/There are/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
  
  // --- Interaction tests for tag selection ---
  it("calls setSelectedTag with null when the 'All' button is clicked", () => {
    render(
      <CourseTagsList 
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
      <CourseTagsList 
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
  
  // --- Edit button test ---
  it("renders an edit button when isUser is false", () => {
    render(
      <CourseTagsList 
        tags={[{ id: 1, tag: "Tag1" }]} 
        selectedTag={null} 
        setSelectedTag={setSelectedTagMock}
        isUser={false}
      />
    );
    const editButton = screen.getByTestId("edit-button");
    expect(editButton).toBeInTheDocument();
  });
  
  // --- Scroll functionality tests ---
  it("shows left and right arrows when the tags list is overflowing", async () => {
    render(
      <CourseTagsList 
        tags={[
          { id: 1, tag: "Tag1" },
          { id: 2, tag: "Tag2" },
          { id: 3, tag: "Tag3" },
          { id: 4, tag: "Tag4" },
          { id: 5, tag: "Tag5" }
        ]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    // Find the tags list element by matching a class that contains "tags-list"
    const tagsList = document.querySelector('div[class*="tags-list"]');
    expect(tagsList).toBeDefined();
    
    // Manually set scroll properties
    Object.defineProperty(tagsList, "scrollLeft", { value: 50, writable: true });
    Object.defineProperty(tagsList, "clientWidth", { value: 100, writable: true });
    Object.defineProperty(tagsList, "scrollWidth", { value: 200, writable: true });
    
    // Dispatch a scroll event so that checkOverflow is triggered.
    fireEvent.scroll(tagsList);
    
    // Check that left arrow ("<") and right arrow (">") buttons appear.
    await waitFor(() => {
      expect(screen.getByText("<")).toBeInTheDocument();
      expect(screen.getByText(">")).toBeInTheDocument();
    });
  });
  
  it("calls scrollBy on left arrow when clicked", async () => {
    render(
      <CourseTagsList 
        tags={[
          { id: 1, tag: "Tag1" },
          { id: 2, tag: "Tag2" },
          { id: 3, tag: "Tag3" },
          { id: 4, tag: "Tag4" },
          { id: 5, tag: "Tag5" }
        ]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    const tagsList = document.querySelector('div[class*="tags-list"]');
    expect(tagsList).toBeDefined();
    
    // Simulate scroll state so that left arrow should be visible.
    Object.defineProperty(tagsList, "scrollLeft", { value: 100, writable: true });
    Object.defineProperty(tagsList, "clientWidth", { value: 100, writable: true });
    Object.defineProperty(tagsList, "scrollWidth", { value: 300, writable: true });
    
    // Spy on scrollBy.
    const scrollBySpy = vi.fn();
    tagsList.scrollBy = scrollBySpy;
    
    fireEvent.scroll(tagsList);
    
    await waitFor(() => {
      expect(screen.getByText("<")).toBeInTheDocument();
    });
    const leftArrow = screen.getByText("<");
    fireEvent.click(leftArrow);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: -150, behavior: "smooth" });
  });
  
  it("calls scrollBy on right arrow when clicked", async () => {
    render(
      <CourseTagsList 
        tags={[
          { id: 1, tag: "Tag1" },
          { id: 2, tag: "Tag2" },
          { id: 3, tag: "Tag3" },
          { id: 4, tag: "Tag4" },
          { id: 5, tag: "Tag5" }
        ]}
        selectedTag={null}
        setSelectedTag={setSelectedTagMock}
        isUser={true}
      />
    );
    const tagsList = document.querySelector('div[class*="tags-list"]');
    expect(tagsList).toBeDefined();
    
    // Simulate scroll state so that right arrow is visible.
    Object.defineProperty(tagsList, "scrollLeft", { value: 0, writable: true });
    Object.defineProperty(tagsList, "clientWidth", { value: 100, writable: true });
    Object.defineProperty(tagsList, "scrollWidth", { value: 250, writable: true });
    
    const scrollBySpy = vi.fn();
    tagsList.scrollBy = scrollBySpy;
    
    fireEvent.scroll(tagsList);
    
    await waitFor(() => {
      expect(screen.getByText(">")).toBeInTheDocument();
    });
    const rightArrow = screen.getByText(">");
    fireEvent.click(rightArrow);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: 150, behavior: "smooth" });
  });
});
