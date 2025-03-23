import React from "react";

/**
 * Component for rendering paragraph content in the module
 * 
 * @param {Object} paragraphData - The paragraph data to render
 */
const ParagraphContent = ({ paragraphData }) => {
  return (
    <div className="alt-paragraph">
      <p>{paragraphData.text}</p>
    </div>
  );
};

export default ParagraphContent;