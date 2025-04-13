// A component for uploading and resizing inline images in modules

import React, { useState, useEffect, useRef } from "react";
import { FiImage, FiTrash2, FiDownload, FiCheckCircle, FiEdit, FiSave } from "react-icons/fi";
import DragDropUploader from "./DragDropUploader";
import ImageService from "../../services/ImageService";

import styles from "../../styles/InlinePictureUploader.module.css";

// Wrapper for AddModule, similar to DocumentEditorWrapper
const InlinePictureEditorWrapper = React.forwardRef((props, ref) => {
    const { moduleId, quizType, documentId } = props;
    const pictureUploaderRef = useRef(null);

    // Pass the actual module ID to the InlinePictureUploader (not the CONTENT ID)
    const actualModuleId = moduleId && typeof moduleId === 'string' && moduleId.startsWith('new-') ? null : moduleId;

    console.log("[DEBUG] InlinePictureEditorWrapper props:", { moduleId, quizType, documentId });
    console.log("[DEBUG] InlinePictureEditorWrapper actualModuleId:", actualModuleId);

    // This matches the API expected by AddModule.jsx
    React.useImperativeHandle(ref, () => ({
      getQuestions: () => {
        // Return empty array to satisfy the interface
        return [];
      },

      getTempFiles: () => {
        // Making sure it's returning the file correctly
        console.log("[DEBUG] getTempFiles called in InlinePictureEditorWrapper");
        console.log("[DEBUG] pictureUploaderRef.current:", pictureUploaderRef.current);

        if (pictureUploaderRef.current && typeof pictureUploaderRef.current.getTempFiles === 'function') {
          const files = pictureUploaderRef.current.getTempFiles() || [];
          // Instead of transforming the files, pass them through as-is
          // This ensures handleUpload can still use its matching logic
          console.log("[DEBUG] Files returned from getTempFiles:", files);
          return files;
        } else {
          console.warn("[DEBUG] getTempFiles function not found on pictureUploaderRef.current");
          return [];
        }
      },

      setTempFiles: (files) => {
        if (pictureUploaderRef.current && typeof pictureUploaderRef.current.setTempFiles === 'function') {
          pictureUploaderRef.current.setTempFiles(files);
        }
      }
    }));

    return (
      <div>
        <InlinePictureUploader
          ref={pictureUploaderRef}
          moduleId={actualModuleId}
          documentId={documentId}
          allowDirectUpload={true}
          temporaryMode={moduleId === null || (typeof moduleId === 'string' && moduleId.startsWith("new-")) || documentId.startsWith("new-")}
        />
      </div>
    );
});

const InlinePictureUploader = React.forwardRef(({
  moduleId,
  documentId,
  existingImages = [],
  allowDirectUpload = false,
  temporaryMode = false
}, ref) => {
  const [images, setImages] = useState(existingImages);
  const [tempFiles, setTempFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentEditImage, setCurrentEditImage] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const resizableRef = useRef(null);

  // Debug logging for component props
  console.log("[DEBUG] InlinePictureUploader received moduleId:", moduleId);
  console.log("[DEBUG] InlinePictureUploader received contentId:", documentId);
  console.log("[DEBUG] InlinePictureUploader temporaryMode:", temporaryMode);
  console.log("[DEBUG] InlinePictureUploader initial images:", existingImages);

  useEffect(() => {
    // Fetch existing images for this module if moduleId is provided
    if (moduleId && !temporaryMode) {
      console.log("[DEBUG] Fetching images because moduleId exists and not in temporaryMode");
      fetchImages();
    } else {
      console.log("[DEBUG] Not fetching images. Reason:", !moduleId ? "No moduleId" : "In temporaryMode");
    }
  }, [moduleId, documentId, temporaryMode]);

  // DEBUG for useState for tempFiles
  useEffect(() => {
    console.log("[DEBUG] tempFiles state updated:", tempFiles);
  }, [tempFiles]);

  // DEBUG for images state updates
  useEffect(() => {
    console.log("[DEBUG] images state updated:", images);
  }, [images]);

  // Set up resize event listeners when in edit mode
  useEffect(() => {
      if (editMode && resizableRef.current) {
        const resizable = resizableRef.current;
        let startX, startY, startWidth, startHeight;
        let aspectRatio = originalDimensions.width / originalDimensions.height;

        // Create references to current dimensions that won't cause re-renders
        const currentDimensions = {
          width: dimensions.width,
          height: dimensions.height
        };

        // Helper function to handle resize - called during mousemove
        const handleResize = (e) => {
          e.preventDefault(); // Prevent text selection during drag

          // Calculate the change in mouse position
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          // Use a scaling factor to make resize more responsive
          const scaleFactor = 1.5;
          const scaledDeltaX = deltaX * scaleFactor;
          const scaledDeltaY = deltaY * scaleFactor;

          // Determine which dimension should lead (width or height)
          // based on which has the larger relative change
          const widthChange = Math.abs(scaledDeltaX / startWidth);
          const heightChange = Math.abs(scaledDeltaY / startHeight);

          let newWidth, newHeight;

          if (widthChange >= heightChange) {
            // Width leads the resize
            newWidth = Math.max(50, startWidth + scaledDeltaX);
            newHeight = newWidth / aspectRatio;
          } else {
            // Height leads the resize
            newHeight = Math.max(50, startHeight + scaledDeltaY);
            newWidth = newHeight * aspectRatio;
          }

          // Round to avoid subpixel rendering issues
          currentDimensions.width = Math.round(newWidth);
          currentDimensions.height = Math.round(newHeight);

          // Update the element style directly for smooth rendering
          resizable.style.width = `${currentDimensions.width}px`;
          resizable.style.height = `${currentDimensions.height}px`;

          // Update the dimensions overlay if it exists
          const overlay = resizable.querySelector(`.${styles.dimensionsOverlay}`);
          if (overlay) {
            overlay.style.display = 'block';
            overlay.textContent = `${currentDimensions.width} × ${currentDimensions.height}px`;
          }
        };

        // Function to start resizing
        const startResize = (e) => {
          const isResizeHandle = e.target.classList.contains(styles.resizeHandle);

          if (isResizeHandle) {
            e.preventDefault();
            e.stopPropagation();

            // Store starting positions
            startX = e.clientX;
            startY = e.clientY;
            startWidth = currentDimensions.width;
            startHeight = currentDimensions.height;

            // Show visual feedback that we're resizing
            resizable.classList.add(styles.resizing);
            const overlay = resizable.querySelector(`.${styles.dimensionsOverlay}`);
            if (overlay) overlay.style.display = 'block';

            // Add global event listeners for move and up
            document.addEventListener('mousemove', handleResize, { passive: false });
            document.addEventListener('mouseup', stopResize);
          }
        };

        // Function to stop resizing - called on mouseup
        const stopResize = () => {
          resizable.classList.remove(styles.resizing);

          // Final state update after resize is complete
          setDimensions({
            width: currentDimensions.width,
            height: currentDimensions.height
          });

          const overlay = resizable.querySelector(`.${styles.dimensionsOverlay}`);
          if (overlay) overlay.style.display = 'none';

          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', stopResize);
        };

        // Add mousedown listener to the resizable element
        resizable.addEventListener('mousedown', startResize);

        // Clean up all event listeners when component unmounts or edit mode changes
        return () => {
          resizable.removeEventListener('mousedown', startResize);
          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', stopResize);
        };
      }
  }, [editMode, originalDimensions]);

  const fetchImages = async () => {
    console.log("[CRITICAL DEBUG] fetchImages called with:", {
      moduleId: moduleId,
      documentId: documentId,
      temporaryMode: temporaryMode
    });
    try {
      // Fetch all images for this module
      const response = await ImageService.getModuleImages(moduleId);
      console.log('[DEBUG] All images for module:', response);

      if (documentId && !documentId.toString().startsWith('new-')) {
        // For existing documents, only show the images that matches this ID
        const filteredImages = response.filter(image => image.contentID === documentId);
        console.log(`[DEBUG] Filtered image files for ID ${documentId}:`, filteredImages);
        
        // Sort images by creation time (oldest first)
        filteredImages.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;
        });

        setImages(filteredImages);
      } else {
        // For new components or if no documentId is provided, show empty
        console.log('[DEBUG] No specific documentId or new component, setting empty images');
        setImages([]);
      }
    } catch (err) {
      console.error("[ERROR] Error fetching images:", err);
      setError("Failed to load images. Please try again.");
    }
  };

  React.useImperativeHandle(ref, () => ({
    getTempFiles: () => {
      console.log("[DEBUG] getTempFiles called, returning:", tempFiles);
      
      console.log("[CRITICAL DEBUG] getTempFiles called for InlinePictureUploader", {
        moduleId: moduleId,
        temporaryMode: temporaryMode,
        imagesLength: images.length,
        tempFilesLength: tempFiles.length
      });

      tempFiles.forEach(file => {
        console.log(`[CRITICAL DEBUG] Temp File Details:`, {
          id: file.id,
          filename: file.filename,
          width: file.width,
          height: file.height,
          fileExists: !!file.file,
          fileType: file.file ? file.file.type : 'No file',
          fileSize: file.file ? file.file.size : 'No file'
        });
      });

      // Log the current dimensions of each file for debugging
      tempFiles.forEach(file => {
          console.log(`[DEBUG] File ${file.filename} dimensions: ${file.width}×${file.height}`);
      });

      const tempFileIds = new Set(tempFiles.map(file => file.id));
      
      // If we're in edit mode and already have displayed images, include them
      if (moduleId && images.length > 0) {
        const existingFiles = images.filter(image => !tempFileIds.has(image.contentID)).map(image => ({
          id: image.contentID,
          file: {
            name: image.filename,
            size: image.file_size || 0,
            type: getMimeType(image.filename)
          },
          originalImage: image // Keep reference to original image
        }));
        
        // Return both temporary and existing files
        return [...tempFiles, ...existingFiles];
      }
      
      return tempFiles;
    },

    setTempFiles: (files) => {
      console.log("[DEBUG] setTempFiles called with files:", files);
      
      // If files are from preview mode restoration, they might have originalImage
      const processedFiles = files.map(file => {
        if (file.originalImage) {
          return {
            ...file,
            file: {
              name: file.originalImage.filename,
              size: file.originalImage.file_size || 0
            },
            width: file.originalImage.width,
            height: file.originalImage.height,
            filename: file.originalImage.filename
          };
        }
        return file;
      });
      
      setTempFiles(processedFiles);
    }
  }));

  const handleUpload = async (formData) => {
      console.log("[DEBUG] handleUpload called with temporaryMode:", temporaryMode, "moduleId:", moduleId);
      console.log("[DEBUG] Current images before upload:", images);
      console.log("[DEBUG] Current tempFiles before upload:", tempFiles);

      if (temporaryMode || !moduleId) {
        // In temporary mode, just store the files in state
        console.log("[DEBUG] In temporary mode, storing files locally");
        const files = formData.getAll('files');
        console.log("[DEBUG] Files from formData:", files);

        // Process image files to get dimensions
        const processImagePromises = files.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                // Calculate reasonable dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                // Set a maximum default size (e.g., 500px wide)
                const maxDefaultWidth = 500;
                if (width > maxDefaultWidth) {
                  const ratio = maxDefaultWidth / width;
                  width = maxDefaultWidth;
                  height = Math.round(height * ratio);
                }
                resolve({
                  id: Date.now() + Math.random().toString(36).substring(2, 9),
                  file: file,
                  filename: file.name,
                  file_size: file.size,
                  file_type: file.name.split('.').pop().toLowerCase(),
                  created_at: new Date().toISOString(),
                  file_size_formatted: formatFileSize(file.size),
                  title: file.name,
                  width: width,
                  height: height,
                  originalWidth: img.width,
                  originalHeight: img.height
                });
              };
              img.src = e.target.result;
            };
            reader.readAsDataURL(file);
          });
        });

        const tempFileData = await Promise.all(processImagePromises);
        setTempFiles(tempFileData);
        console.log("[DEBUG] Setting new tempFiles:", tempFileData);

        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);

        console.log("[DEBUG] Temporary files stored:", tempFileData);
        return tempFileData;
      } else {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
          // Always use the actual moduleId for uploads
          if (moduleId) {
            // Extract the real module ID if it's an object
            const actualModuleId = typeof moduleId === 'object'
                ? moduleId.moduleID || moduleId.moduleId || moduleId.id
                : moduleId;
            console.log("[DEBUG] Original moduleId:", moduleId);
            console.log("[DEBUG] Extracted actualModuleId:", actualModuleId);

            // Get the files from the FormData
            const files = formData.getAll('files');

            // Create a new FormData object for the actual upload
            const enhancedFormData = new FormData();

            // Add module ID to the enhanced form data
            enhancedFormData.append('module_id', actualModuleId);

            // If a component ID is provided, add it to the enhanced form data
            if (documentId) {
              enhancedFormData.append('component_id', documentId);
            }

            // Process each file, adding both the file and its dimensions to the enhanced form data
            for (let i = 0; i < files.length; i++) {
              const file = files[i];

              // Add the file to the enhanced FormData
              enhancedFormData.append('files', file);

              // Log the current file being processed
              console.log(`[DEBUG] Processing file ${i}: ${file.name}, size: ${file.size}`);

              // Find the matching temp file to get its dimensions
              const matchingTempFile = tempFiles.find(tf =>
                tf.file.name === file.name && tf.file.size === file.size
              );

              // Log what was found (or not found)
              if (matchingTempFile) {
                    console.log(`[DEBUG] Found matching tempFile:`, matchingTempFile);
              } else {
                    console.log(`[DEBUG] No matching tempFile found for ${file.name}`);
              }

              // Get dimensions from tempFiles if available, otherwise use defaults
              // Convert to integers to ensure they're numbers
              let width = 600;  // Default width
              let height = 400; // Default height

              if (matchingTempFile) {
                // Log all properties of the matchingTempFile to find where dimensions might be
                console.log("[DEBUG] matchingTempFile properties:", Object.keys(matchingTempFile));

                // Check various possible places where dimensions might be stored
                if (matchingTempFile.width && matchingTempFile.height) {
                    width = parseInt(matchingTempFile.width);
                    height = parseInt(matchingTempFile.height);
                    console.log(`[DEBUG] Using direct properties - dimensions: ${width}×${height}`);
                } else if (matchingTempFile.metadata && matchingTempFile.metadata.width && matchingTempFile.metadata.height) {
                    width = parseInt(matchingTempFile.metadata.width);
                    height = parseInt(matchingTempFile.metadata.height);
                    console.log(`[DEBUG] Using metadata properties - dimensions: ${width}×${height}`);
                } else {
                    console.log("[DEBUG] Couldn't find dimensions in the matchingTempFile, using defaults");
                }
              }

              // Add dimensions explicitly as strings to the enhanced form data
              enhancedFormData.append(`width_${i}`, width.toString());
              enhancedFormData.append(`height_${i}`, height.toString());

              // Log what's being sent to the server
              console.log(`[DEBUG] Sending dimensions to server for ${file.name}: ${width}×${height}`);
            }

            // Store component ID in enhancedFormData if available
            if (documentId) {
              console.log(`[DEBUG] Uploading files to module ID: ${actualModuleId}, component ID ${documentId}`);

              // Delete old images associated with this component ID before uploading new ones
              console.log(`[DEBUG] Attempting to delete images for component ID: ${documentId}`);

              try {
                // First, get all images for this module
                const allModuleImages = await ImageService.getModuleImages(moduleId);

                // Find images that have a description mentioning this contentId
                const imagesToDelete = allModuleImages.filter(image => image.contentID === documentId);
                console.log(`[DEBUG] Found ${imagesToDelete.length} images to delete for component ID ${documentId}`);

                // Delete each image
                for (const imageToDelete of imagesToDelete) {
                  try {
                    console.log(`[DEBUG] Deleting image with ID: ${imageToDelete.contentID}`);
                    await ImageService.deleteImage(imageToDelete.contentID);
                    console.log(`[DEBUG] Successfully deleted image with ID: ${imageToDelete.contentID}`);
                  } catch (deleteError) {
                    console.error(`[DEBUG] Failed to delete image ${imageToDelete.contentID}:`, deleteError);
                    // We'll continue even if delete fails
                  }
                }

                // Verify image files were deleted
                const remainingImages = await ImageService.getModuleImages(moduleId);
                const stillExisting = remainingImages.filter(image => image.contentID === documentId);
                console.log(`[DEBUG] After deletion: ${stillExisting.length} image files still exist for component ID ${documentId}`);

                if (stillExisting.length > 0) {
                  console.warn(`[WARNING] Not all image files were deleted for component ID ${documentId}`);
                }
              } catch (error) {
                console.error(`[DEBUG] Error while trying to delete existing image files:`, error);
              }

              // verify image files were deleted
              try {
                const checkImages = await ImageService.getModuleImages(moduleId);
                const remainingImages = checkImages.filter(image => image.contentID === documentId);
                console.log(`[DEBUG] Images files remaining after deletion attempt:`, remainingImages);
              } catch (err) {
                console.error(`[DEBUG] Error checking image files after deletion`, err)
              }
            } else {
              console.log(`[DEBUG] Uploading files to module ID: ${actualModuleId} without component ID`);
            }

            // Log the form data being sent (enhancedFormData)
            console.log("[DEBUG] Enhanced FormData entries:");
            for (let [key, value] of enhancedFormData.entries()) {
              console.log(`${key}: ${value instanceof File ? value.name : value}`);
            }

            // Use the enhanced FormData with dimensions for the upload
            const uploadedImages = await ImageService.uploadImages(enhancedFormData);
            console.log("[DEBUG] Uploaded images response:", uploadedImages);

            // If this is a single image component, replace rather than append
            if (documentId) {
              console.log("[DEBUG] Setting images with replacement for contentId:", documentId);
              console.log("[DEBUG] New images:", uploadedImages);
              console.log("[DEBUG] Old images:", images);

              // Replace the images but PRESERVE the original component ID
              const updatedImages = uploadedImages.map(image => ({
                ...image,
                // Store documentId in a different field but keep the server's ID intact
                associatedContentID: documentId
              }));

              console.log("[DEBUG] Updated images with preserved component ID:", updatedImages);
              setImages(updatedImages);
            } else {
              // Regular handling for non-replacement uploads
              console.log("[DEBUG] Appending new images to existing ones");
              setImages(prevImgs => {
                const newImages = [...prevImgs, ...uploadedImages];
                console.log("[DEBUG] Combined images:", newImages);
                return newImages;
              });
            }

            setSuccess(true);

            // Show success message for 3 seconds
            setTimeout(() => {
              setSuccess(false);
            }, 3000);

            return uploadedImages;
          }
        } catch (err) {
          console.error("[ERROR] Error uploading images:", err);
          setError(`Upload failed: ${err.response?.data?.detail || err.message}`);
          throw err;
        } finally {
          setUploading(false);
        }
      }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (imageId) => {
    console.log("[DEBUG] handleDelete called for imageId:", imageId);

    if (!window.confirm('Are you sure you want to delete this image?')) {
      console.log("[DEBUG] Delete cancelled by user");
      return;
    }

    try {
      console.log("[DEBUG] Deleting image with ID:", imageId);
      await ImageService.deleteImage(imageId);

      console.log("[DEBUG] Image deleted successfully, updating state");
      console.log("[DEBUG] Current images:", images);

      const updatedImages = images.filter(image => image.contentID !== imageId);
      console.log("[DEBUG] Updated images after filter:", updatedImages);

      setImages(updatedImages);

      // Exit edit mode if we're deleting the current editing image
      if (currentEditImage && currentEditImage.contentID === imageId) {
        console.log("[DEBUG] Closing editor for deleted image");
        setEditMode(false);
        setCurrentEditImage(null);
      }
    } catch (err) {
      console.error("[ERROR] Error deleting image:", err);
      setError(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Handle deleting temporary files
  const handleDeleteTemp = (id) => {
    console.log("[DEBUG] handleDeleteTemp called for id:", id);

    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    console.log("[DEBUG] Deleting temp file with ID:", id);
    console.log("[DEBUG] Current tempFiles:", tempFiles);

    const updatedTempFiles = tempFiles.filter(file => file.id !== id);
    console.log("[DEBUG] Updated tempFiles after filter:", updatedTempFiles);

    setTempFiles(updatedTempFiles);

    // Exit edit mode if we're deleting the current editing image
    if (currentEditImage && currentEditImage.id === id) {
      setEditMode(false);
      setCurrentEditImage(null);
    }
  };

  const handleDownload = async (img) => {
    console.log("[DEBUG] handleDownload called for image:", img);

    try {
      // Handle TEMPORARY files (not yet uploaded to server)
      if (img.file && !img.file_url) {
        console.log("[DEBUG] Downloading temporary file");
        // For temporary files, we can create a download directly from the File object
        const objectUrl = URL.createObjectURL(img.file);
        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = img.filename || "image.jpg";
        downloadLink.click();

        // Clean up the temporary URL
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Handle SERVER-STORED files
      console.log("[DEBUG] Downloading server-stored file");
      // Use the backend server URL instead of the frontend URL
      const backendUrl = import.meta.env.VITE_API_URL; // Django port
      const fileUrl = img.file_url && typeof img.file_url === 'string' && img.file_url.startsWith('http')
        ? img.file_url
        : `${backendUrl}${img.file_url}`;

      console.log("[DEBUG] Download URL:", fileUrl);

      const response = await fetch(fileUrl, {
        credentials: 'include' // This includes cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const blob = await response.blob();
      console.log("[DEBUG] Blob created successfully:", blob.type, "size:", blob.size, "bytes");

      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = img.filename || "image.jpg";
      downloadLink.click();

      URL.revokeObjectURL(objectUrl);

    } catch (error) {
      console.error("[ERROR] Download failed with error:", error.message);
      alert("Failed to download the file. Please try again.");
    }
  };

  const handleEdit = (image) => {
    console.log("[DEBUG] handleEdit called for image:", image);
    setCurrentEditImage(image);

    // Set initial dimensions from the image
    const width = image.width || image.originalWidth || 300;
    const height = image.height || image.originalHeight || 200;

    setDimensions({ width, height });
    setOriginalDimensions({ width: image.originalWidth || width, height: image.originalHeight || height });
    setEditMode(true);
  };

  const handleSaveResize = async () => {
    console.log("[DEBUG] handleSaveResize called");
    console.log("[DEBUG] New dimensions:", dimensions);
    console.log("[DEBUG] Current edit image full object:", currentEditImage);

    // Check if we have an image to save
    if (!currentEditImage) {
      console.error("[ERROR] No image selected for resize");
      return;
    }

    try {
      if (temporaryMode || !moduleId) {
        // For temporary files, just update the dimensions in the tempFiles state
        console.log("[DEBUG] Updating dimensions for temporary file:", currentEditImage.id);

        const updatedTempFiles = tempFiles.map(file => {
          if (file.id === currentEditImage.id) {
            return {
              ...file,
              width: dimensions.width,
              height: dimensions.height
            };
          }
          return file;
        });
        console.log("[INFO] Updated dimensions - Width:", dimensions.width, "Height:", dimensions.height);
        setTempFiles(updatedTempFiles);
      } else {
        // For server-stored images, send update to server
        const imageId = currentEditImage.id || currentEditImage.contentID;
        console.log("[DEBUG] Using image ID for update:", imageId);

        await ImageService.updateImageDimensions(
          imageId,
          dimensions.width,
          dimensions.height
        );

        // Update local state
        const updatedImages = images.map(img => {
          if (img.contentID === currentEditImage.contentID) {
            return {
              ...img,
              width: dimensions.width,
              height: dimensions.height
            };
          }
          return img;
        });

        setImages(updatedImages);
      }

      // Exit edit mode
      setEditMode(false);
      setCurrentEditImage(null);

      // Show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("[ERROR] Error saving image dimensions:", err);
      setError(`Save failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getImagePreviewUrl = (image) => {
    // For temporary files
    if (image.file && !image.file_url) {
      return URL.createObjectURL(image.file);
    }

    // For server-stored files
    const backendUrl = import.meta.env.VITE_API_URL;
    return image.file_url && typeof image.file_url === 'string' && image.file_url.startsWith('http')
      ? image.file_url
      : `${backendUrl}${image.file_url}`;
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();

    switch (extension) {
      case 'jpeg':
      case 'jpg':
      case 'png':
      case 'gif':
      case '.webp':
        return <FiImage className={styles.imageIcon} />;
      default:
        return <FiImage />;
    }
  };

  const getMimeType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'bmp':
        return 'image/bmp';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream'; // fallback for unknown types
    }
  };

  const isTemporaryMode = temporaryMode || !moduleId || (typeof moduleId === 'string' && moduleId.startsWith("new-"));
  const displayedImages = isTemporaryMode ? tempFiles : images;
  console.log("[DEBUG] isTemporaryMode:", isTemporaryMode);
  console.log("[DEBUG] displayedImages:", displayedImages);

  return (
    <div className={styles.inlinePictureUploader}>
      <h3 className={styles.title}>Inline Pictures</h3>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <FiCheckCircle /> {editMode ? "Image resized successfully!" : "Images uploaded successfully!"}
        </div>
      )}

      {/* Only show uploader when not in edit mode */}
      {!editMode && (
        <DragDropUploader onUpload={handleUpload} acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp" mediaType='image' />
      )}

      {/* Image Editor Modal */}
      {editMode && currentEditImage && (
        <div className={styles.editorModal}>
          <div className={styles.editorHeader}>
            <h4>Resize Image</h4>
            <div className={styles.dimensionsInfo}>
              <span>Width: {Math.round(dimensions.width)}px</span>
              <span>Height: {Math.round(dimensions.height)}px</span>
            </div>
            <div className={styles.editorActions}>
              <button className={styles.saveButton} onClick={handleSaveResize}>
                <FiSave /> Save
              </button>
              <button className={styles.cancelButton} onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>

          <div className={styles.editorContent}>
            <div
              ref={resizableRef}
              className={`${styles.resizableContainer} ${isResizing ? styles.resizing : ''}`}
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`
              }}
            >
              <img
                src={getImagePreviewUrl(currentEditImage)}
                alt={currentEditImage.title || currentEditImage.filename}
                className={styles.resizableImage}
              />
              <div className={styles.dimensionsOverlay} style={{display: isResizing ? 'block' : 'none'}}>
                  {Math.round(dimensions.width)} × {Math.round(dimensions.height)}px
              </div>
              <div className={styles.resizeHandle}></div>
            </div>
            <div className={styles.resizeInstructions}>
              <p>Drag the corner handle to resize the image. The aspect ratio will be maintained.</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Images List */}
      {!editMode && displayedImages.length > 0 && (
        <div className={styles.imagesList}>
          <h4 className={styles.sectionTitle}>Uploaded Images</h4>
          {displayedImages.map((img) => (
            <div key={img.contentID || img.id} className={styles.imageItem}>
              <div className={styles.imagePreview}>
                <img
                  src={getImagePreviewUrl(img)}
                  alt={img.title || img.filename}
                  style={{
                    width: img.width ? `${img.width}px` : 'auto',
                    height: img.height ? `${img.height}px` : 'auto',
                    maxWidth: '100%',
                    maxHeight: '150px'
                  }}
                />
              </div>
              <div className={styles.imageInfo}>
                <span className={styles.imageName} title={img.filename}>
                  {img.title || img.filename}
                </span>
                <span className={styles.imageMeta}>
                  {img.width || img.originalWidth || 0}×{img.height || img.originalHeight || 0}px •
                  {img.file_size_formatted || formatFileSize(img.file_size)} •
                  {formatDate(img.created_at || img.updated_at)}
                </span>
              </div>
              <div className={styles.imageActions}>
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(img)}
                  title="Resize Image"
                >
                  <FiEdit />
                </button>
                <button
                  className={styles.downloadButton}
                  onClick={() => handleDownload(img)}
                  title="Download"
                >
                  <FiDownload />
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => isTemporaryMode ? handleDeleteTemp(img.id) : handleDelete(img.contentID)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editMode && displayedImages.length === 0 && (
        <p className={styles.noImages}>No images uploaded yet.</p>
      )}
    </div>
  );
});

export { InlinePictureEditorWrapper };
export default InlinePictureUploader;