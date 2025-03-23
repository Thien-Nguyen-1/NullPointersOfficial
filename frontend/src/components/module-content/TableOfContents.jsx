import React from "react";

/**
 * Table of Contents component for the module view
 * 
 * @param {Array} moduleContent - Array of module sections
 * @param {string} activeSection - ID of the currently active section
 * @param {Function} setActiveSection - Function to update the active section
 */
const TableOfContents = ({ moduleContent, activeSection, setActiveSection }) => {
  return (
    <div className="alt-table-of-contents">
      <h3>Table of Contents</h3>
      <ul>
        {moduleContent.map((section) => (
          <li 
            key={section.id}
            className={activeSection === section.id ? 'active' : ''}
            onClick={() => {
              document.getElementById(section.id).scrollIntoView({ behavior: 'smooth' });
              setActiveSection(section.id);
            }}
          >
            {section.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TableOfContents;