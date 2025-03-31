// components/ModuleEditorComponent.jsx
// this component renders the appropriate editor based on the MODULE TYPE  (flashcard, document, etc.)
// it handles (dynamically) selecting and configuring the right editor component for each module

import React from 'react';
import VisualFlashcardEditor from "../editors/VisualFlashcardEditor";
import VisualFillTheFormEditor from "../editors/VisualFillTheFormEditor";
import VisualFlowChartQuiz from "../editors/VisualFlowChartQuiz";
import VisualQuestionAndAnswerFormEditor from "../editors/VisualQuestionAndAnswerFormEditor";
import VisualMatchingQuestionsQuizEditor from "../editors/VisualMatchingQuestionsQuizEditor";
import HeadingsComponent from "../editors/Headings";
import { DocumentEditorWrapper } from "../editors/DocumentUploader";
import { AudioEditorWrapper } from "../editors/AudioUploader";

export const ModuleEditorComponent = ({ 
  module, 
  editorRefs, 
  initialQuestionsRef, 
  removeModule, 
  moduleOptions, 
  media, 
  styles 
}) => {
  // Component mapping
  const componentMap = {
    // Template
    "Flashcard Quiz": VisualFlashcardEditor,
    "Fill in the Blanks": VisualFillTheFormEditor,
    "Flowchart Quiz": VisualFlowChartQuiz,
    "Question and Answer Form": VisualQuestionAndAnswerFormEditor,
    "Matching Question Quiz": VisualMatchingQuestionsQuizEditor,
    // Media
    "Upload Document": DocumentEditorWrapper,
    "Upload Audio": AudioEditorWrapper,
    // Heading
    "heading": HeadingsComponent
  };

  let EditorComponent = null;
  
  if (module.componentType === "template") {
    EditorComponent = componentMap[module.type];
  } else if (module.componentType === "heading") {
    EditorComponent = HeadingsComponent;
  } else if (module.componentType === "media") {
    EditorComponent = componentMap[module.type];
  }

  // Handle case when component is not found
  if (!EditorComponent) {
    return (
      <div className={`${styles["module-item"]} ${styles["error"]}`}>
        <h3>{module.type} (ID: {module.id.substring(0, 6)}...) - Error: No editor found</h3>
      </div>
    );
  }

  // Handle heading components
  if (module.componentType === "heading") {
    return (
      <div className={styles["module-item"]}>
        <EditorComponent
          headingSize={module.size}
          key={`editor-${module.id}`}
        />  
        <button 
          onClick={() => removeModule(module.id)} 
          className={styles["remove-module-btn"]}
        >
          Remove
        </button>
      </div>
    );
  }

  // Handle regular and media components
  return (
    <div className={styles["module-item"]}>
      <h3>{module.type} (ID: {module.id.substring(0, 6)}...)</h3>
      <EditorComponent
        ref={(el) => { 
          editorRefs.current[module.id] = el;
        }}
        moduleId={module.moduleId}
        documentId={module.id}
        quizType={module.componentType === "media" ? module.mediaType : module.quizType}
        initialQuestions={initialQuestionsRef.current[module.id] || []}
        key={`editor-${module.id}`}
      />
      <button 
        onClick={() => removeModule(module.id)} 
        className={styles["remove-module-btn"]}
      >
        Remove
      </button>
    </div>
  );
};

