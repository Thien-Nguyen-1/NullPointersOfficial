// this hook manages all tag-related operations including fetching available tags, adding new tags, and removing tags from a module

import { useState, useCallback } from 'react';
import api from '../services/api';

export const useTags = () => {
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  
  // Get all available tags from the server
  const fetchTags = useCallback(async () => {
    try {
      const response = await api.get('/api/tags/');
      setAvailableTags(response.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
      throw err;
    }
  }, []);
  
  // Adds a new tag (creates it if it doesnt exist)
  const addTag = async () => {
    const newTag = prompt('Enter a new tag:');
    if (!newTag || newTag.trim() === '') return;
    
    // Convert to lowercase for case-insensitive comparison
    const newTagLower = newTag.toLowerCase().trim();
    
    // Check if the tag already exists in availableTags (case-insensitive)
    const existingTag = availableTags.find(
      tag => tag.tag.toLowerCase() === newTagLower
    );
    
    if (existingTag) {
      // Check if this tag is already selected
      if (tags.includes(existingTag.id)) {
        alert("This tag is already added to the module.");
        return;
      }
      // Add the existing tag
      setTags([...tags, existingTag.id]);
    } else {
      // Create a new tag
      try {
        const response = await api.post('/api/tags/', { tag: newTagLower });
        setAvailableTags([...availableTags, response.data]);
        setTags([...tags, response.data.id]);
      } catch (err) {
        // Handle errors including unique constraint violations
        if (err.response?.data?.tag?.[0]?.includes("already exists")) {
          alert("This tag already exists in the system.");
          
          // Try to fetch all tags again to get the updated list
          await fetchTags();
        } else {
          console.error("Error creating tag:", err);
          throw err;
        }
      }
    }
  };
  
  // Remove a tag
  const removeTag = (tagId) => {
    setTags(tags.filter(t => t !== tagId));
  };
  
  return { tags, setTags, availableTags, setAvailableTags, fetchTags, addTag, removeTag };
};
