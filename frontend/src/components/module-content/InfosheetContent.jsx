import React from "react";

  // Render an infosheet component

  /**
 * Component for rendering video content in the module
 * 
 * @param {Object} infosheetData - The infosheet data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when content is completed
 */
const InfosheetContent = ({infosheetData, completedContentIds, onComplete}) => {
    return (
        <div className="alt-component">
        <div className="alt-component-header">
            <h3>{infosheetData.title}</h3>
            {completedContentIds.has(infosheetData.id) && (
            <span className="completed-check">✓</span>
            )}
        </div>
        <div className="alt-component-content">
            <div className="alt-infosheet">
            <p>{infosheetData.content}</p>
            </div>
            
            <div className="alt-mark-complete">
            {!completedContentIds.has(infosheetData.id) && (
                <button 
                className="mark-complete-button"
                onClick={() => onComplete(infosheetData.id, { viewed: true })}
                >
                Mark as Viewed
                </button>
            )}
            </div>
        </div>
        </div>
    );
};

export default InfosheetContent;
