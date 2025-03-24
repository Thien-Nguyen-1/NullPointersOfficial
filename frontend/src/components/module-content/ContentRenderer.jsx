import React, {useContext } from "react";
import { AuthContext } from "../../services/AuthContext";
import ImageContent from "./ImageContent";
import VideoContent from "./VideoContent";
import InfosheetContent from "./InfosheetContent";
import QuizContent from "./QuizContent";
import HeadingContent from "./HeadingContent";
import ParagraphContent from "./ParagraphContent";
import { markContentAsViewed } from "../../services/api";

/**
 * ContentRenderer component that determines which content component to render
 * based on the item type.
 * 
 * @param {Object} item - The content item to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onContentComplete - Callback function when content is completed
 */
const ContentRenderer = ({ item, completedContentIds, onContentComplete }) => {
  const { user, token } = useContext(AuthContext);
  console.log("ContentRenderer rendering item:", item.type, item.id);
  console.log("AuthContext values:", { user: !!user, hasToken: !!token });
  // Handler for when content is completed/viewed
  const handleContentComplete = async (contentId, results) => {
    console.log("handleContentComplete called with:", contentId, item.type);
    
    // Skip tracking for non-trackable content types
    if (!['image', 'video', 'infosheet', 'quiz'].includes(item.type)) {
      console.log("Skipping - not a trackable content type:", item.type);
      if (onContentComplete) onContentComplete(contentId, results);
      return;
    }
    
    // Skip if already completed
    if (completedContentIds.has(contentId)) {
      console.log("Skipping - already completed:", contentId);
      if (onContentComplete) onContentComplete(contentId, results);
      return;
    }
    
    // Skip if user is not authenticated
    if (!user || !token) {
      console.log("User not logged in, not tracking content completion");
      if (onContentComplete) onContentComplete(contentId, results);
      return;
    }
    
    console.log("Auth token (first few chars):", token ? token.substring(0, 10) + "..." : "null");
    console.log("User authenticated:", !!user);
    
    try {
      console.log("Attempting to mark content as viewed:", contentId, item.type);
      // Call the API to mark content as viewed
      const result = await markContentAsViewed(contentId, item.type, token);
      console.log("Content marked as viewed:", result);
      // Call the parent component's completion handler
      if (onContentComplete) {
        onContentComplete(contentId, results);
      }
    } catch (error) {
      console.error("Failed to mark content as viewed:", error);
      // Still call the parent handler even if API call fails
      if (onContentComplete) {
        onContentComplete(contentId, results);
      }
    }
  
  }
  switch (item.type) {
    case 'heading':
      return <HeadingContent headingData={item} />;
    case 'paragraph':
      return <ParagraphContent paragraphData={item} />;
    case 'image':
      return <ImageContent 
        imageData={item} 
        completedContentIds={completedContentIds} 
        onComplete={handleContentComplete} 
      />;
    case 'video':
      return <VideoContent 
        videoData={item} 
        completedContentIds={completedContentIds} 
        onComplete={handleContentComplete} 
      />;
    case 'infosheet':
      return <InfosheetContent 
        infosheetData={item} 
        completedContentIds={completedContentIds} 
        onComplete={handleContentComplete} 
      />;
    case 'quiz':
      return <QuizContent 
        quizData={item} 
        completedContentIds={completedContentIds} 
        onComplete={handleContentComplete} 
      />;
    default:
      return <div className="alt-error">Unknown content type: {item.type}</div>;
  }
};

export default ContentRenderer;