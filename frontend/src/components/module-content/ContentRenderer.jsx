import React, {useContext } from "react";
import { AuthContext } from "../../services/AuthContext";
import ImageContent from "./ImageContent";
import VideoContent from "./VideoContent";
import InfosheetContent from "./InfosheetContent";
import QuizContent from "./QuizContent";
//import HeadingContent from "./HeadingContent";
import ParagraphContent from "./ParagraphContent";
import AudioContent from "./AudioContent";
import { markContentAsViewed } from "../../services/api";

/**
 * ContentRenderer component that determines which content component to render
 * based on the item type.
 * 
 * @param {Object} item - The content item to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onContentComplete - Callback function when content is completed
 * @param {Boolean} isPreviewMode - Whether we're in preview mode
 */
const ContentRenderer = ({ item, completedContentIds, onContentComplete, isPreviewMode= false }) => {
  const { user, token } = useContext(AuthContext);
  console.log("ContentRenderer rendering item:", item.type, item.id);
  console.log("AuthContext values:", { user: !!user, hasToken: !!token });
  // Handler for when content is completed/viewed
  const handleContentComplete = async (contentId, results) => {
    // If in PREVIEW MODE, do nothing
    if (isPreviewMode) return;
    console.log(`handleContentComplete called for ${item.type}:`, contentId);
    
    // Skip if user is not authenticated
    if (!user || !token) {
      console.log("User not logged in, not tracking content completion");
      if (onContentComplete) onContentComplete(contentId, results);
      return;
    }
    
    try {
      // Handle based on content type
      if (item.type === 'quiz') {
        // For quizzes, submit answers first
        console.log("Submitting quiz answers:", results);
        await QuizApiUtils.submitQuizAnswers(
          item.taskData.contentID,
          results,
          token
        );
      }
      
      // Mark content as viewed/completed (for all content types)
      console.log(`Marking ${item.type} as viewed:`, contentId);
      const result = await markContentAsViewed(contentId, item.type, token);
      console.log("Content marked as viewed result:", result);
      
      // Call the parent component's completion handler
      if (onContentComplete) {
        onContentComplete(contentId, results);
      }
    } catch (error) {
      console.error(`Failed to complete ${item.type}:`, error);
      // Still call the parent handler even if API call fails
      if (onContentComplete) {
        onContentComplete(contentId, results);
      }
    }
  };

  //  wrapper  for preview mode items
  const PreviewWrapper = ({children, type}) => {
    if (!isPreviewMode) return children;

    return (
      <div className="preview-item-wrapper">
        {children}
        <div className="preview-overlay">
          <p className="preview-message">
          {type === 'quiz' 
              ? 'Quiz interaction available in published version' 
              : type === 'infosheet'
                ? 'Document download available in published version'
                : type === 'audio'
                  ? 'Audio playback available in published version'
                  : type === 'image'
                    ? 'Image interaction available in published version'
                    : type === 'video'
                      ? 'Video playback available in published version'
                      : 'Content interaction available in published version'
            }
          </p>
        </div>
      </div>
    );
  };

  switch (item.type) {
    case 'paragraph':
      return <ParagraphContent paragraphData={item} />;
    case 'image':
      const processedImageData = {
        ...item,
        // Make sure the source property exists (try multiple possible locations)
        source: item.source || 
        (item.file_url ? (item.file_url.startsWith('http') ? item.file_url : `http://localhost:8000${item.file_url}`) : null) || 
        (item.imageFiles && item.imageFiles[0] && item.imageFiles[0].file_url ? 
          (item.imageFiles[0].file_url.startsWith('http') ? item.imageFiles[0].file_url : `http://localhost:8000${item.imageFiles[0].file_url}`) : null),
        // Ensure other required properties are available
        width: item.width || (item.imageFiles && item.imageFiles[0] && item.imageFiles[0].width) || null,
        height: item.height || (item.imageFiles && item.imageFiles[0] && item.imageFiles[0].height) || null,
        id: item.id,
        title: item.title || "Image"
      };
      console.log("Processed image data for display:", processedImageData);
      return (
        <PreviewWrapper type="image">
            <ImageContent
            imageData={processedImageData} 
            completedContentIds={completedContentIds} 
            onComplete={handleContentComplete} 
          />
        </PreviewWrapper>
      );
    case 'video':
      return (
        <PreviewWrapper type="video">
          <VideoContent 
            videoData={item} 
            completedContentIds={completedContentIds} 
            onComplete={handleContentComplete} 
          />
        </PreviewWrapper>
      );
    case 'infosheet':
      return (
        <PreviewWrapper type="infosheet">
          <InfosheetContent 
            infosheetData={item} 
            completedContentIds={completedContentIds} 
            onComplete={handleContentComplete} 
          />
        </PreviewWrapper>
      );
    case 'audio': 
      return (
        <PreviewWrapper type="audio">
          <AudioContent 
            audioData={item} 
            completedContentIds={completedContentIds} 
            onComplete={handleContentComplete} 
          />
        </PreviewWrapper>
      );
      
    case 'quiz':
      return (
        <PreviewWrapper type="quiz">
          <QuizContent 
            quizData={item} 
            completedContentIds={completedContentIds} 
            onComplete={handleContentComplete} 
            isPreviewMode={isPreviewMode}
          />
        </PreviewWrapper>
      );

    default:
      return <div className="alt-error">Unknown content type: {item.type}</div>;
  }
};

export default ContentRenderer;