import { render, screen, fireEvent } from "@testing-library/react";
import EnrollmentModal from "../../components/EnrollmentModal";

describe("EnrollmentModal", () => {
  const mockModule = {
    id: 1,
    title: "Test Module",
    description: "Test module description"
  };

  const setup = (propsOverrides = {}) => {
    const onClose = vi.fn();
    const onEnroll = vi.fn();

    render(
      <EnrollmentModal
        isOpen={true}
        onClose={onClose}
        onEnroll={onEnroll}
        module={mockModule}
        isEnrolled={false}
        {...propsOverrides}
      />
    );

    return { onClose, onEnroll };
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <EnrollmentModal
        isOpen={false}
        onClose={() => {}}
        onEnroll={() => {}}
        module={mockModule}
        isEnrolled={false}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("displays module info and 'Enrol Me' button when not enrolled", () => {
    setup();

    expect(screen.getByText("Enrol in Course")).toBeInTheDocument();
    expect(screen.getByText("Test Module")).toBeInTheDocument();
    expect(screen.getByText("Test module description")).toBeInTheDocument();
    expect(screen.getByText("Enrol Me")).toBeInTheDocument();
  });

  it("displays already enrolled message and 'Continue Learning' button", () => {
    setup({ isEnrolled: true });

    expect(screen.getByText("Module Information")).toBeInTheDocument();
    expect(screen.getByText("You are already enrolled in this module.")).toBeInTheDocument();
    expect(screen.getByText("Continue Learning")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when '×' button is clicked", () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onEnroll with module id when 'Enrol Me' is clicked", () => {
    const { onEnroll } = setup();

    fireEvent.click(screen.getByText("Enrol Me"));
    expect(onEnroll).toHaveBeenCalledWith(mockModule.id);
  });

  it("closes modal when clicking outside the modal content", () => {
    const { onClose } = setup();
  
    const overlay = document.querySelector(".enrollment-modal-overlay");
    fireEvent.click(overlay); // click directly on the overlay
  
    expect(onClose).toHaveBeenCalled();
  });

  it("does not close modal if inner content is clicked", () => {
    const { onClose } = setup();

    const modalContent = screen.getByText("Test Module");
    fireEvent.click(modalContent);
    expect(onClose).not.toHaveBeenCalled();
  });
});
