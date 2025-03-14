import React, { useState, useRef, useEffect } from 'react';
import '../styles/InlineRichTextEditor.css';

const InlineRichTextEditor = ({ initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent || '');
  const editorRef = useRef(null);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  
  // Font size options (limited range)
  const fontSizes = [
    { label: 'Small', value: '0.875rem' },
    { label: 'Normal', value: '1rem' },
    { label: 'Medium', value: '1.125rem' },
    { label: 'Large', value: '1.25rem' }
  ];
  
  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showListMenu || showAlignMenu) {
        const isDropdownButton = event.target.closest('.dropdown-toggle');
        const isDropdownMenu = event.target.closest('.dropdown-menu');
        
        if (!isDropdownButton && !isDropdownMenu) {
          setShowListMenu(false);
          setShowAlignMenu(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showListMenu, showAlignMenu]);
  
  // Focus the editor when mounted and set initial content
  useEffect(() => {
    if (editorRef.current) {
      // Set the initial content correctly
      editorRef.current.innerHTML = initialContent || '';
      editorRef.current.focus();
    }
  }, [initialContent]);
  
  const handleFormatting = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // Update content state after formatting
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
    
    // Close dropdown menus after selection
    setShowListMenu(false);
    setShowAlignMenu(false);
  };
  
  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    handleFormatting('fontSize', size === '1rem' ? '3' : 
                              size === '0.875rem' ? '2' : 
                              size === '1.125rem' ? '4' : 
                              size === '1.25rem' ? '5' : '3');
  };
  
  // Handle input in a more direct way
  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };
  
  // Save the content explicitly to ensure we have the latest
  const handleSave = () => {
    // Make sure we're sending the latest content from the DOM
    const currentContent = editorRef.current ? editorRef.current.innerHTML : content;
    onSave(currentContent);
  };
  
  // Toggle dropdown menus
  const toggleListMenu = (e) => {
    e.preventDefault();
    setShowListMenu(!showListMenu);
    setShowAlignMenu(false);
  };
  
  const toggleAlignMenu = (e) => {
    e.preventDefault();
    setShowAlignMenu(!showAlignMenu);
    setShowListMenu(false);
  };
  
  return (
    <div className="inline-rich-text-editor">
      <div className="editor-toolbar">
        {/* Text formatting options */}
        <div className="toolbar-group">
          <button 
            type="button" 
            className="format-btn" 
            title="Bold"
            onClick={() => handleFormatting('bold')}
          >
            <strong>B</strong>
          </button>
          <button 
            type="button" 
            className="format-btn" 
            title="Italic"
            onClick={() => handleFormatting('italic')}
          >
            <em>I</em>
          </button>
          <button 
            type="button" 
            className="format-btn" 
            title="Underline"
            onClick={() => handleFormatting('underline')}
          >
            <u>U</u>
          </button>
        </div>
        
        <div className="separator"></div>
        
        {/* List formatting dropdown */}
        <div className="dropdown">
          <button 
            type="button" 
            className="dropdown-toggle" 
            onClick={toggleListMenu}
            title="List Options"
          >
            List
          </button>
          {showListMenu && (
            <div className="dropdown-menu">
              <button 
                type="button" 
                className="dropdown-item" 
                onClick={() => handleFormatting('insertUnorderedList')}
              >
                Bullet List
              </button>
              <button 
                type="button" 
                className="dropdown-item" 
                onClick={() => handleFormatting('insertOrderedList')}
              >
                Numbered List
              </button>
            </div>
          )}
        </div>
        
        {/* Text alignment dropdown */}
        <div className="dropdown">
          <button 
            type="button" 
            className="dropdown-toggle" 
            onClick={toggleAlignMenu}
            title="Alignment Options"
          >
            Align
          </button>
          {showAlignMenu && (
            <div className="dropdown-menu">
              <button 
                type="button" 
                className="dropdown-item" 
                onClick={() => handleFormatting('justifyLeft')}
              >
                ⟵ Left
              </button>
              <button 
                type="button" 
                className="dropdown-item" 
                onClick={() => handleFormatting('justifyCenter')}
              >
                ⟷ Center
              </button>
              <button 
                type="button" 
                className="dropdown-item" 
                onClick={() => handleFormatting('justifyRight')}
              >
                ⟶ Right
              </button>
              <button 
                type="button" 
                className="dropdown-item" 
                onClick={() => handleFormatting('justifyFull')}
              >
                ≡ Justify
              </button>
            </div>
          )}
        </div>
        
        <div className="separator"></div>
        
        {/* Font size selector */}
        <div className="toolbar-group">
          <select 
            className="font-size-select"
            onChange={handleFontSizeChange}
            defaultValue="1rem"
          >
            <option value="" disabled>Font Size</option>
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div 
        ref={editorRef}
        className="editor-content" 
        contentEditable={true}
        onInput={handleInput}
      />
      
      <div className="button-group">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default InlineRichTextEditor;