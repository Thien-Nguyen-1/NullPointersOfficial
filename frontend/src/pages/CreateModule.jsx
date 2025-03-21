import React, { useState } from "react";
import axios from "axios";

const CreateModule = () => {
    const [ModuleTitle, setModuleTitle] = useState("");
    const [finalModuleTitle, setFinalModuleTitle] = useState("");
    const [ModuleDesc, setModuleDesc] = useState("");
    const [finalModuleDesc, setFinalModuleDesc] = useState("");
    const [selectedElements, setSelectedElements] = useState([]); // List of added elements
    const [selectedOption, setSelectedOption] = useState(""); // Current selection
    const [rankingTiers, setRankingTiers] = useState(0); // Number of tiers for Ranking Question
    const [tierTexts, setTierTexts] = useState([]); // Stores user input for tiers
    const [isEditingRanking, setIsEditingRanking] = useState(false); // Editing mode for Ranking Question
    const [uploadedImage, setUploadedImage] = useState(null); // Stores uploaded image for Inline Picture
    const [uploadedImageTitle, setUploadedImageTitle] = useState("");
    const [uploadedAudio, setUploadedAudio] = useState(null);
    const [uploadedAudioTitle, setUploadedAudioTitle] = useState("");
    const [uploadedDocuments, setUploadedDocuments] = useState([]); // Stores uploaded docs
    const [documentTitles, setDocumentTitles] = useState({});
    const [uploadedDocumentsTitle, setUploadedDocumentsTitle] = useState("");
    const [uploadedVideoTitle, setUploadedVideoTitle] = useState("");
    const [uploadedVideoURL, setUploadedVideoURL] = useState("");
    const [publishMessage, setPublishMessage] = useState("");

    // Function to handle dropdown selection
    const handleSelectOption = (e) => {
        const value = e.target.value;
        setSelectedOption(value);

        if (value !== "Ranking Question") {
            setIsEditingRanking(false);
        }

        if (value === "Ranking Question") {
            setIsEditingRanking(true);
            setRankingTiers(0);
            setTierTexts([]);
        } else if (value === "Inline Picture") {
            setUploadedImage(null);
            setUploadedImageTitle("");
        } else if (value === "Audio Clip") {
            setUploadedAudio(null);
            setUploadedAudioTitle("");
        } else if (value === "Attach PDF") {
            setUploadedDocuments([]); // Reset previous uploads
            setDocumentTitles({});
            setUploadedDocumentsTitle("");
        } else if (value === "Embedded Video") {
            setUploadedVideoURL(""); // Reset previous uploads
            setUploadedVideoTitle("");
        }
    };

    // Function to generate ranking tiers
    const handleSetRankingTiers = () => {
        if (rankingTiers > 0) {
            setTierTexts(Array.from({ length: rankingTiers }, () => ""));
        }
    };

    // Function to handle text change in ranking tiers
    const handleTierTextChange = (index, newText) => {
        const updatedTexts = [...tierTexts];
        updatedTexts[index] = newText;
        setTierTexts(updatedTexts);
    };

    // Function to finalize and add the Ranking Question
    const handleAddRankingQuestion = () => {
        if (tierTexts.every(text => text.trim() !== "")) {
            setSelectedElements([...selectedElements, { type: "Ranking Question", data: [...tierTexts] }]);
            setIsEditingRanking(false);
            setSelectedOption("");
        } else {
            alert("Please fill in all ranking tiers before adding.");
        }
    };

    // Function to move a tier up
    const moveTierUp = (elementIndex, tierIndex) => {
        setSelectedElements((prevElements) =>
            prevElements.map((element, idx) => {
                if (idx === elementIndex && tierIndex > 0) {
                    const updatedTiers = [...element.data];
                    [updatedTiers[tierIndex], updatedTiers[tierIndex - 1]] = [updatedTiers[tierIndex - 1], updatedTiers[tierIndex]];
                    return { ...element, data: updatedTiers };
                }
                return element;
            })
        );
    };

    // Function to move a tier down
    const moveTierDown = (elementIndex, tierIndex) => {
        setSelectedElements((prevElements) =>
            prevElements.map((element, idx) => {
                if (idx === elementIndex && tierIndex < element.data.length - 1) {
                    const updatedTiers = [...element.data];
                    [updatedTiers[tierIndex], updatedTiers[tierIndex + 1]] = [updatedTiers[tierIndex + 1], updatedTiers[tierIndex]];
                    return { ...element, data: updatedTiers };
                }
                return element;
            })
        );
    };

    // Function to handle image upload for Inline Picture
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("audio/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedAudio(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid audio file (MP3, MP4, WAV, etc.).");
        }
    };

    // Function to handle document uploads
    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        const newDocuments = files.map(file => ({
            file,
            url: URL.createObjectURL(file), // Create a preview URL -> create blob URLs
            name: file.name,
            type: file.name.split(".").pop(), // Extract file extension
        }));

        setUploadedDocuments((prevDocs) => [...prevDocs, ...newDocuments]);
    };

    const handleRemoveDocument = (index) => {
        setUploadedDocuments((prevDocs) => prevDocs.filter((_, i) => i !== index)); // ✅ Remove document

        setDocumentTitles((prevTitles) => {
            const newTitles = Object.values(prevTitles); // ✅ Convert to array
            newTitles.splice(index, 1); // ✅ Remove the title at the index
            return Object.fromEntries(newTitles.map((title, i) => [i, title])); // ✅ Rebuild object with correct keys
        });
    };

    // Function to update document titles
    const handleDocumentTitleChange = (index, title) => {
        setDocumentTitles((prevTitles) => ({ ...prevTitles, [index]: title }));
    };

    const handleDownload = (doc, index) => {
        const link = document.createElement("a");
        link.href = doc.url;
        // Use the custom title from documentTitles if available, otherwise use original filename
        const filename = documentTitles[index] ? `${documentTitles[index]}.${doc.type}` : doc.name;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleModuleTitle = () => {
        if (ModuleTitle.trim() === "") {
            alert("Please enter a module title.");
            return;
        }
        setFinalModuleTitle(ModuleTitle);
    };

    const handleModuleDesc = () => {
        if (ModuleDesc.trim() === "") {
            alert("Please enter a module description.");
            return;
        }
        setFinalModuleDesc(ModuleDesc);
    };


    // Function to add selected element
    const handleAddElement = () => {
        if (selectedOption === "Ranking Question") return;

        if (selectedOption === "Inline Picture" && !uploadedImage) {
            alert("Please upload an image before adding.");
            return;
        }

        if (selectedOption === "Audio Clip" && !uploadedAudio) {
            alert("Please upload an audio clip before adding.");
            return;
         }

        if (selectedOption === "Attach PDF") {
            if (!uploadedDocumentsTitle.trim()) { // ✅ Require title for document section
                alert("Please enter a title for the document section.");
                return;
            }
            if (uploadedDocuments.length === 0) {
                alert("Please upload at least one document before adding.");
                return;
            }
        }

        if (selectedOption === "Embedded Video" && !uploadedVideoURL ) {
            if (!uploadedVideoTitle.trim()) {
                alert("Please enter a title for the embedded video.");
                return;
            }
            if (!uploadedVideoURL) {
                alert("Please paste a link for the embedded video.");
                return;
            }
        }

        let newElement = {}; // ✅ Declare newElement correctly

        if (selectedOption === "Attach PDF") {
            newElement = {
                type: "Attach PDF",
                title: uploadedDocumentsTitle,
                data: uploadedDocuments.map((doc, index) => ({
                    name: doc.name,
                    title: documentTitles[index] || doc.name.split('.')[0],
                    url: doc.url,
                    fileType: doc.type
                }))
            };
        } else if (selectedOption === "Inline Picture") {
            newElement = {
                type: "Inline Picture",
                title: uploadedImageTitle || "",
                data: uploadedImage
            };
        } else if (selectedOption === "Audio Clip") {
            newElement = {
                type: "Audio Clip",
                title: uploadedAudioTitle || "",
                data: uploadedAudio
            };
        } else if (selectedOption === "Embedded Video") {
            newElement = {
                type: "Embedded Video",
                title: uploadedVideoTitle,
                data: uploadedVideoURL
            };
        } else {
            newElement = {
                type: selectedOption,
                title: "",
                data: selectedOption
            };
        }

        setSelectedElements([...selectedElements, newElement]); // ✅ Add new element to state

        // ✅ Reset input fields
        setSelectedOption("");
        setUploadedImageTitle("");
        setUploadedAudioTitle("");
        setUploadedDocumentsTitle("");
        setUploadedVideoTitle("");
        setUploadedVideoURL("");
        setUploadedDocuments([]);
        setDocumentTitles({});
    };

    const handlePublishModule = async () => {
        // Validate module title
        if (!finalModuleTitle) {
            alert("Please enter a module title before publishing.");
            return;
        }
        // Validate at least one element exists
        if (selectedElements.length === 0) {
            alert("Module must have at least one element before publishing.");
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/publish-module/", {
                title: finalModuleTitle,
                description: finalModuleDesc || '',
                elements: selectedElements.map(element => ({
                    type: element.type,
                    title: element.title || '',
                    data: element.type === 'Ranking Question' ? element.data :
                           element.type === 'Inline Picture' ? element.data :
                           element.type === 'Audio Clip' ? element.data :
                           element.type === 'Attach PDF' ? element.data :
                           element.type === 'Embedded Video' ? element.data :
                           element.data
                }))
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}` // Assuming you're using token-based auth
                }
            });

            setPublishMessage("Module published successfully!");
            setSelectedElements([]);
            setFinalModuleTitle(''); // Reset module title
            setFinalModuleDesc('');
            // Additional resets to clear input fields
            setModuleTitle('');
            setModuleDesc('');
        } catch (error) {
            console.error("Publish error:", error.response ? error.response.data : error.message);
            setPublishMessage("Failed to publish module. Please try again.");
        }
    };

    return (
        <div>
            <h1>Module Builder</h1>

            {/* Display module title & description if set */}
            {finalModuleTitle && <h2>Module Title: {finalModuleTitle}</h2>}
            {finalModuleDesc && <p>Module Description : {finalModuleDesc}</p>}

            <div style={{ display: "flex", width: "100%" }}>
                <input
                    type="text"
                    placeholder="Enter Title Module"
                    value={ModuleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    style={{ padding: "5px", flexGrow: 1 }}
                />
                <button
                    onClick={handleModuleTitle}
                    style={{ marginLeft: "10px", padding: "5px", cursor: "pointer" }}
                >
                    Set Module Title
                </button>
            </div>
            <div style={{ marginTop: "10px", display: "flex", width: "100%" }} >
                <input
                        type="text"
                        placeholder="Enter Title Description"
                        value={ModuleDesc}
                        onChange={(e) => setModuleDesc(e.target.value)}
                        style={{ padding: "5px", flexGrow: 1 }}
                    />
                    <button
                        onClick={handleModuleDesc}
                        style={{ marginLeft: "10px", padding: "5px", cursor: "pointer" }}
                    >
                        Set Module Description
                    </button>
            </div>

            {/* Dropdown Menu */}
            <div style={{ marginTop: "20px"}}>
                <label htmlFor="moduleOptions">Select an element to add next: </label>
                <select
                    id="moduleOptions"
                    value={selectedOption}
                    onChange={handleSelectOption}
                    style={{ marginLeft: "10px", padding: "5px" }}
                >
                    <option value="">-- Select --</option>
                    <option value="Ranking Question">Ranking Question</option>
                    <option value="Inline Picture">Inline Picture</option>
                    <option value="Audio Clip">Audio Clip</option>
                    <option value="Attach PDF">Attach PDF / Documents / Infosheet</option>
                    <option value="Embedded Video">Embedded Video</option>
                </select>
            </div>

            {/* Upload Button for Inline Picture */}
            {selectedOption === "Inline Picture" && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", width: "100%" }}>
                        <input
                            type="text"
                            placeholder="Enter Title for Inline Image *Not Required"
                            value={uploadedImageTitle}
                            onChange={(e) => setUploadedImageTitle(e.target.value)}
                            style={{ padding: "5px", flexGrow: 1 }}
                        />
                        <button
                            onClick={handleAddElement}
                            style={{ marginLeft: "10px", padding: "5px", cursor: "pointer" }}
                        >
                            Add Element
                        </button>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ marginTop: "10px" }}
                    />
                </div>
            )}

            {/* Upload Button for Audio Clips */}
            {selectedOption === "Audio Clip" && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", width: "100%" }}>
                        <input
                            type="text"
                            placeholder="Enter Title for Audio *Not Required"
                            value={uploadedAudioTitle}
                            onChange={(e) => setUploadedAudioTitle(e.target.value)}
                            style={{ padding: "5px", flexGrow: 1 }}
                        />
                        <button
                            onClick={handleAddElement}
                            style={{ marginLeft: "10px", padding: "5px", cursor: "pointer" }}
                        >
                            Add Element
                        </button>
                    </div>
                    <input
                        type="file"
                        accept="audio/mp3, audio/mp4"
                        onChange={handleAudioUpload}
                        style={{ marginTop: "10px" }}
                    />
                </div>
            )}

            {/* Upload Section for Video Link */}
           {selectedOption === "Embedded Video" && (
            <div style={{ marginTop: "10px", width: "100%" }}>
                <input
                    type="text"
                    placeholder="Enter Title for Video *Required"
                    value={uploadedVideoTitle}
                    onChange={(e) => setUploadedVideoTitle(e.target.value)}
                    style={{
                        padding: "5px",
                        width: "100%",  // ✅ Full width
                        marginBottom: "10px"  // ✅ Spacing before the next input
                    }}
                />


                <div style={{ display: "flex", width: "100%" }}>
                    <input
                        type="text"
                        placeholder="Paste video link (YouTube, Google Drive, etc.)"
                        value={uploadedVideoURL}
                        onChange={(e) => setUploadedVideoURL(e.target.value)}
                        style={{
                            padding: "5px",
                            flexGrow: 1
                        }}
                    />
                    <button
                        onClick={handleAddElement}
                        style={{
                            marginLeft: "10px",
                            padding: "5px",
                            cursor: "pointer"
                        }}
                    >
                        Add Element
                    </button>
                </div>
            </div>
            )}


            {/* Upload Section for Attach PDF */}
            {selectedOption === "Attach PDF" && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ display: "flex", width: "100%" }}>
                        <input
                            type="text"
                            placeholder="Enter title for document section *Required"
                            value={uploadedDocumentsTitle}
                            onChange={(e) => setUploadedDocumentsTitle(e.target.value)}
                            style={{ padding: "5px", flexGrow: 1 }}
                        />
                        <button
                            onClick={handleAddElement}
                            style={{ marginLeft: "10px", padding: "5px", cursor: "pointer" }}
                        >
                            Add Element
                        </button>
                    </div>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        multiple
                        onChange={handleDocumentUpload}
                        style={{ marginTop: "10px" }}
                    />

                    {uploadedDocuments.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                            {uploadedDocuments.map((doc, index) => (
                                <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDownload(doc, index); }} style={{ fontSize: "20px", textDecoration: "none" }}>📄</a>
                                    <input
                                        type="text"
                                        placeholder="Enter document title"
                                        value={documentTitles[index] || ""}
                                        onChange={(e) => handleDocumentTitleChange(index, e.target.value)}
                                        style={{ padding: "5px", width: "250px" }}
                                    />
                                    <span style={{ fontStyle: "italic" }}>{doc.type.toUpperCase()}</span>
                                    <button
                                        onClick={() => handleRemoveDocument(index)}
                                        style={{ background: "none", border: "none", color: "red", fontSize: "16px", cursor: "pointer" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Ranking Question Setup */}
            {isEditingRanking && (
                <div style={{ marginTop: "20px", padding: "10px", border: "1px solid gray", borderRadius: "5px" }}>
                    <p>Enter the number of ranking tiers:</p>
                    <input
                        type="number"
                        min="1"
                        value={rankingTiers}
                        onChange={(e) => setRankingTiers(Number(e.target.value))}
                        style={{ marginRight: "10px", padding: "5px", width: "50px" }}
                    />
                    <button onClick={handleSetRankingTiers} style={{ padding: "5px", cursor: "pointer" }}>
                        Set
                    </button>

                    {/* Show Editable Ranking Tiers */}
                    {tierTexts.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                            {tierTexts.map((text, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    placeholder="Edit this text"
                                    value={text}
                                    onChange={(e) => handleTierTextChange(index, e.target.value)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "10px",
                                        margin: "5px 0",
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                    }}
                                />
                            ))}
                            <button onClick={handleAddRankingQuestion} style={{ marginTop: "10px", padding: "5px", cursor: "pointer" }}>
                                Add Ranking Question
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Display List of Added Elements */}
            <div style={{ marginTop: "20px" }}>
                {selectedElements.map((element, elementIndex) => (
                    <div key={elementIndex} style={{ padding: "10px", borderBottom: "1px solid lightgray" }}>
                        {/* ✅ Display Title if Available */}
                        {element.title && (
                            <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                                {element.title}
                            </p>
                        )}
                        {element.type === "Ranking Question" ? (
                            <div>
                                {element.data.map((tier, tierIndex) => (
                                    <div key={tierIndex} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px",
                                        margin: "5px 0",
                                        background: "#f8f9fa",
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                        color: "black"
                                    }}>
                                        {tier}
                                        <div>
                                            <button onClick={() => moveTierUp(elementIndex, tierIndex)} disabled={tierIndex === 0}>⬆</button>
                                            <button onClick={() => moveTierDown(elementIndex, tierIndex)} disabled={tierIndex === element.data.length - 1}>⬇</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : element.type === "Inline Picture" ? (
                            <img src={element.data} alt="Uploaded" style={{ maxWidth: "500px", height: "auto", borderRadius: "5px" }} />
                        ) : element.type === "Audio Clip" ? (
                            <audio controls src={element.data} />
                        ) : element.type === "Embedded Video" ? (
                            <div style={{ maxWidth: "500px", height: "auto", borderRadius: "5px", overflow: "hidden" }}>
                                <iframe
                                    width="500"  // ✅ Same width as inline pictures
                                    height="281" // ✅ Maintain aspect ratio (16:9)
                                    src={element.data.includes("youtube.com") || element.data.includes("youtu.be")
                                        ? element.data.replace("watch?v=", "embed/") // ✅ Convert YouTube link
                                        : element.data} // ✅ Use other links as-is
                                    title={element.title}
                                    frameBorder="0"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : element.type === "Attach PDF" ? (
                            <div>
                                {element.data.map((doc, index) => (
                                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <a href="#" onClick={(e) => {
                                                e.preventDefault();
                                                // Create a function to handle download from published elements
                                                const downloadPublishedDoc = () => {
                                                    const link = document.createElement("a");
                                                    link.href = doc.url;
                                                    // Use the title that was saved when the element was added
                                                    link.download = doc.title ? `${doc.title}.${doc.fileType}` : doc.name;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                };
                                                downloadPublishedDoc();
                                            }}
                                            style={{ fontSize: "20px", textDecoration: "none" }}
                                        >
                                            📄
                                        </a>
                                        <span>{doc.title} - Type: {doc.fileType.toUpperCase()}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>{element.data}</p>
                        )}
                    </div>
                ))}
            </div>


            {selectedElements.length > 0 && (
                <button onClick={handlePublishModule} style={{ marginTop: "20px", padding: "10px", backgroundColor: "blue", color: "white", cursor: "pointer", borderRadius: "5px" }}>
                    Publish Module
                </button>
            )}


            {publishMessage && <p style={{ marginTop: "10px", fontWeight: "bold", color: publishMessage.includes("failed") ? "red" : "green" }}>{publishMessage}</p>}

        </div>
    );
};

export default CreateModule;
