import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PDFViewer from '../../components/PDFViewer';

const mockBlob = new Blob(['Test PDF'], { type: 'application/pdf' });
const mockObjectUrl = 'blob:http://localhost/fake-pdf';

global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
global.URL.revokeObjectURL = vi.fn();
global.fetch = vi.fn();

describe('PDFViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner initially', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    });

    render(<PDFViewer documentUrl="/api/fake.pdf" documentName="MyDoc.pdf" />);
    expect(screen.getByText(/Loading PDF document/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading PDF document/i)).not.toBeInTheDocument();
    });
  });

  it("calls download and triggers link click", async () => {
    const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
    const mockUrl = "blob:http://localhost/fake-pdf";
    const mockClick = vi.fn();
  
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
  
    const originalCreateElement = document.createElement.bind(document); // ✅ save original
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") {
        const a = originalCreateElement("a"); // ✅ call original, not the spy
        a.click = mockClick;
        return a;
      }
      return originalCreateElement(tag);
    });
  
    vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  
    render(<PDFViewer documentUrl="/api/test.pdf" documentName="MyDoc.pdf" />);
    const downloadBtn = await screen.findByTitle("Download");
    fireEvent.click(downloadBtn);
  
    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
    });
  
    // cleanup
    document.createElement.mockRestore();
    URL.createObjectURL.mockRestore();
    URL.revokeObjectURL.mockRestore();
  });
  
  it("displays error when no documentUrl is provided", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  
    render(<PDFViewer documentUrl={null} documentName="Missing.pdf" />);
    await waitFor(() => {
      expect(screen.getByText(/No document URL provided/i)).toBeInTheDocument();
    });
  
    expect(errorSpy).toHaveBeenCalledWith("No document URL provided");
    errorSpy.mockRestore();
  });
    
  it("uses blob URL directly if provided", async () => {
    render(<PDFViewer documentUrl="blob:http://localhost/blob.pdf" documentName="Blob.pdf" />);
  
    await waitFor(() => {
      const object = document.querySelector('object[data="blob:http://localhost/blob.pdf"]');
      expect(object).toBeInTheDocument();
    });
  });
  
  

  it("constructs full URL from relative path", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
  
    render(<PDFViewer documentUrl="/api/relative.pdf" documentName="Relative.pdf" />);
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("http://localhost:8000/api/relative.pdf", expect.any(Object));
    });
  
    fetchSpy.mockRestore();
  });
  

  it("displays error if PDF fetch fails with 404", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
  
    render(<PDFViewer documentUrl="/api/missing.pdf" documentName="Missing.pdf" />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load PDF/i)).toBeInTheDocument();
      expect(screen.getByText(/Try downloading the document instead/i)).toBeInTheDocument();
    });
  });
  
  it("shows error if download fetch fails", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) }) // initial load
      .mockResolvedValueOnce({ ok: false, status: 500 }); // download failure
  
    render(<PDFViewer documentUrl="/api/fail-download.pdf" documentName="Fail.pdf" />);
    const btn = await screen.findByTitle("Download");
  
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText("Failed to download the document.")).toBeInTheDocument();
    });
  });
  
  
  it("toggles fullscreen mode", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
  
    render(<PDFViewer documentUrl="/api/toggle.pdf" documentName="FullscreenTest.pdf" />);
    const toggleBtn = await screen.findByTitle("Fullscreen");
  
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Exit Fullscreen/i)).toBeInTheDocument();
  
    fireEvent.click(screen.getByText(/Exit Fullscreen/i));
    expect(screen.queryByText(/Exit Fullscreen/i)).not.toBeInTheDocument();
  });
  
});
