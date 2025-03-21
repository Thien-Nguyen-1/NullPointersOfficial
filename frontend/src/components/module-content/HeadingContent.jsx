import React from "react";

/**
 * Component for rendering heading content in the module
 * 
 * @param {Object} headingData - The heading data to render
 */
const HeadingContent = ({ headingData }) => {
  // Use dynamic heading tag based on level (h1, h2, etc.)
  const HeadingTag = `h${headingData.level}`;
  
  return (
    <div className="alt-heading">
      <HeadingTag>{headingData.text}</HeadingTag>
    </div>
  );
};

export default HeadingContent;