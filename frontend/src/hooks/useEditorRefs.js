// this hook provides references to editor components and their initial data
// it allows accessing editor functions like getQuestions() across component boundaries
import { useRef } from 'react';

export const useEditorRefs = () => {
  // Create refs to store references to editor components
  const editorRefs = useRef({});
  // Store initial questions for each module
  const initialQuestionsRef = useRef({});
  
  return { editorRefs, initialQuestionsRef };
};
