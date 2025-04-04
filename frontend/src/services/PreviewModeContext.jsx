// THIS CONTEXT IS FOR DATA TO BE AVAILABLE TO MULTIPLE COMPONENTS: addModule, ModuleViewAlternative, ContentRenderer
// to avoid passing the props through many components

import React, { createContext, useContext, useState } from 'react';

const PreviewModeContext = createContext(null);

export const PreviewModeProvider = ({ children }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // to enter preview mode with data
  const enterPreviewMode = (data) => {
    setPreviewData(data);
    setIsPreviewMode(true);
  };

  // to exit preview mode
  const exitPreviewMode = () => {
    setIsPreviewMode(false);
    setPreviewData(null);
  };

  return (
    <PreviewModeContext.Provider 
      value={{ 
        isPreviewMode,
        previewData,
        enterPreviewMode,
        exitPreviewMode
      }}
    >
      {children}
    </PreviewModeContext.Provider>
  );
};

// custom hook to use the preview mode context
export const usePreviewMode = () => {
  const context = useContext(PreviewModeContext);
  if (!context) {
    throw new Error('usePreviewMode must be used within a PreviewModeProvider');
  }
  return context;
};