// this hook manages FETCHING/STORING/UPDATING module data
// it handles the complex process of retrieving tasks, documents, and audio files for a module
// and transforming them into the structure needed by the editor

import { useState, useCallback } from 'react';
import { QuizApiUtils } from '../services/QuizApiUtils';

export const useModuleData = (editId) => {
  const [modules, setModules] = useState([]);
  
  // fetches all data for a module including associated tasks and media
  const fetchModuleData = useCallback(async (moduleId) => {
    try {
      // Fetch module data
      const moduleData = await QuizApiUtils.getModule(moduleId);
      
      // Destructuring for easier access to responses
      const [tasksResponse, documentsResponse, audiosResponse, imagesResponse, videosResponse] = await Promise.all([
        QuizApiUtils.getModuleSpecificTasks(moduleId).catch(error => {
          console.error("Error fetching tasks:", error);
          return []; // Return empty array on error
        }),
        QuizApiUtils.getModuleContents(moduleId).catch(error => {
          console.error("Error fetching documents:", error);
          return []; // Return empty array on error
        }),
        QuizApiUtils.getModuleContents(moduleId, 'audio').catch(error => {
          console.error("Error fetching audio clips:", error);
          return []; // Return empty array on error
        }),
        QuizApiUtils.getModuleContents(moduleId, 'image').catch(error => {
          console.error("Error fetching inline images:", error);
          return []; // Return empty array on error
        }),
        QuizApiUtils.getModuleContents(moduleId, 'video').catch(error => {
          console.error("Error fetching embedded videos:", error);
          return []; // Return empty array on error
        })
      ]);

      const tasks = tasksResponse || [];
      const documents = documentsResponse || [];
      const audios = audiosResponse || [];
      const images = imagesResponse || [];
      const videos = videosResponse || [];
      
      // Process tasks to create module templates
      const taskTemplates = await Promise.all(tasks.map(async (task) => {
        const componentType = QuizApiUtils.getComponentType(task.quiz_type);
        
        // Get the appropriate type based on component type
        let type;
        if (componentType === 'media') {
          type = QuizApiUtils.getUIMediaTypeFromAPIType(task.quiz_type);
        } else {
          type = QuizApiUtils.getUITypeFromAPIType(task.quiz_type);
        }
        
        return {
          id: task.contentID,
          type,
          quizType: task.quiz_type,
          componentType,
          taskId: task.contentID,
          moduleId: moduleId
        };
      }));
      
      // Process documents
      const documentTemplates = documents.map(doc => ({
        id: doc.contentID,
        type: 'Upload Document',
        quizType: 'document',
        componentType: 'media',
        mediaType: 'document',
        moduleId: moduleId,
        actualModuleId: moduleId
      }));
      
      // Process audio files
      const audioTemplates = audios.map(audio => ({
        id: audio.contentID,
        type: 'Upload Audio',
        quizType: 'audio',
        componentType: 'media',
        mediaType: 'audio',
        moduleId: moduleId,
        actualModuleId: moduleId
      }));

      // Process image files
      const imageTemplates = images.map(image => ({
        id: image.contentID,
        type: 'Upload Image',
        quizType: 'image',
        componentType: 'media',
        mediaType: 'image',
        moduleId: moduleId,
        actualModuleId: moduleId
      }));

      // Process video files
      const videoTemplates = videos.map(video => ({
        id: video.contentID,
        type: 'Link Video',
        quizType: 'video',
        componentType: 'media',
        mediaType: 'video',
        moduleId: moduleId,
        actualModuleId: moduleId
      }));

      // future media
      
      // Combine all templates
      setModules([...taskTemplates, ...documentTemplates, ...audioTemplates, ...imageTemplates, ...videoTemplates]);
      
      // Return module data for setting title, description, etc.
      return moduleData;
    } catch (err) {
      console.error("Error fetching module data:", err);
      throw err;
    }
  }, []);
  
  return { modules, setModules, fetchModuleData };
};
