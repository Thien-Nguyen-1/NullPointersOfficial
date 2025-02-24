import React, { useState } from "react";

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]); // Get the first selected file
  };

  // Handle file upload
  const handleUpload = () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    console.log("Uploading:", selectedFile.name);
    
    // Prepare form data
    const formData = new FormData();
    formData.append("file", selectedFile);

    // Example: Send to API (adjust the URL)
    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("File uploaded successfully:", data);
        alert("File uploaded successfully!");
      })
      .catch((error) => {
        console.error("Upload error:", error);
        alert("Upload failed.");
      });
  };

  return (
    <div className="file-upload-container">
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id="fileInput"
      />
      <label htmlFor="fileInput" className="upload-btn">
        Select File
      </label>

      {selectedFile && <p>Selected File: {selectedFile.name}</p>}

      <button onClick={handleUpload} className="upload-btn">
        Upload
      </button>
    </div>
  );
}

function CreateModule() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Create Module</h1>
      <p className="mt-2 text-gray-600">Upload a module file here:</p>
      <FileUpload />
    </div>
  );
}

export default CreateModule;
