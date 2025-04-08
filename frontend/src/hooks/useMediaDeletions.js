// this hook tracks MEDIA items (documents, audio) that need to be deleted
// it helps maintain a list of pending deletions when editing a module
import { useState } from 'react';

export const useMediaDeletions = () => {
  const [pendingDeletions, setPendingDeletions] = useState({ 
    document: [], 
    audio: [],
    image: [],
    video : [],
    // future media
  });
  
  return { pendingDeletions, setPendingDeletions };
};