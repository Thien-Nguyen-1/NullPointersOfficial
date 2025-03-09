import React from "react";
import ImageContent from "./ImageContent";
import VideoContent from "./VideoContent";
import InfosheetContent from "./InfosheetContent";
import QuizContent from "./QuizContent";
import HeadingContent from "./HeadingContent";
import ParagraphContent from "./ParagraphContent";

/**
 * ContentRenderer component that determines which content component to render
 * based on the item type.
 * 
 * @param {Object} item - The content item to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onContentComplete - Callback function when content is completed
 */
const ContentRenderer = ({ item, completedContentIds, onContentComplete }) => {
  switch (item.type) {
    case 'heading':
      return <HeadingContent headingData={item} />;
    case 'paragraph':
      return <ParagraphContent paragraphData={item} />;
    case 'image':
      return <ImageContent 
        imageData={item} 
        completedContentIds={completedContentIds} 
        onComplete={onContentComplete} 
      />;
    case 'video':
      return <VideoContent 
        videoData={item} 
        completedContentIds={completedContentIds} 
        onComplete={onContentComplete} 
      />;
    case 'infosheet':
      return <InfosheetContent 
        infosheetData={item} 
        completedContentIds={completedContentIds} 
        onComplete={onContentComplete} 
      />;
    case 'quiz':
      return <QuizContent 
        quizData={item} 
        completedContentIds={completedContentIds} 
        onComplete={onContentComplete} 
      />;
    default:
      return <div className="alt-error">Unknown content type: {item.type}</div>;
  }
};

export default ContentRenderer;