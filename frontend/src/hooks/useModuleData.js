// this hook manages FETCHING/STORING/UPDATING module data
// it handles the complex process of retrieving tasks, documents, and audio files for a module
// and transforming them into the structure needed by the editor

import { useState, useCallback } from 'react';
import { QuizApiUtils } from '../services/QuizApiUtils';

export const useModuleData = (editId) => {
  const [modules, setModules] = useState([]);
  
  // fetches all data for a module including associated tasks and media
  const fetchModuleData = useCallback(async (moduleId, initialQuestionsRef) => {
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
      
      // CRITICAL PART: Making sure that questions are fetched when admin/superadmin go back to editor mode
      // fetch questions for each task and store them in initialQuestionsRef
      if (initialQuestionsRef) {
        await Promise.all(tasks.map(async (task) => {
          try {
            const questions = await QuizApiUtils.getQuestions(task.contentID);
            initialQuestionsRef.current[task.contentID] = questions;
          } catch (error) {
            console.error(`Error fetching questions for task ${task.contentID}:`, error);
            initialQuestionsRef.current[task.contentID] = [];
          }
        }));
      }
      
      // Process tasks to create module templates
      const taskTemplates = await Promise.all(tasks.map(async (task) => {
        const componentType = QuizApiUtils.getComponentType(task.quiz_type);
        
        // Get the appropriate type based on component type
        let type;
        if (componentType === 'media') {
          type = QuizApiUtils.getUIMediaTypeFromAPIType(task.quiz_type); // if its a media type
        } else {
          type = QuizApiUtils.getUITypeFromAPIType(task.quiz_type); // if its a quiz type
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
        actualModuleId: moduleId,
        order_index: doc.order_index || 0
      }));
      
      // Process audio files
      const audioTemplates = audios.map(audio => ({
        id: audio.contentID,
        type: 'Upload Audio',
        quizType: 'audio',
        componentType: 'media',
        mediaType: 'audio',
        moduleId: moduleId,
        actualModuleId: moduleId,
        order_index: audio.order_index || 0
      }));

      // Process image files
      const imageTemplates = images.map(image => ({
        id: image.contentID,
        type: 'Upload Image',
        quizType: 'image',
        componentType: 'media',
        mediaType: 'image',
        moduleId: moduleId,
        actualModuleId: moduleId,
        order_index: image.order_index || 0 
      }));

      // Process video files
      const videoTemplates = videos.map(video => ({
        id: video.contentID,
        type: 'Link Video',
        quizType: 'video',
        componentType: 'media',
        mediaType: 'video',
        moduleId: moduleId,
        actualModuleId: moduleId,
        order_index: video.order_index || 0
      }));

      // future media
      console.log("Document order_index samples:", documents.slice(0, 3).map(d => d.order_index));
      console.log("Audio order_index samples:", audios.slice(0, 3).map(a => a.order_index));
      console.log("Image order_index samples:", images.slice(0, 3).map(i => i.order_index));
      console.log("Video order_index samples:", videos.slice(0, 3).map(v => v.order_index));

      // Combine all resources with their order_index
      const mediaResources = [
        ...documentTemplates.map(item => ({ ...item, order_index: item.order_index || 0 })),
        ...audioTemplates.map(item => ({ ...item, order_index: item.order_index || 0 })),
        ...imageTemplates.map(item => ({ ...item, order_index: item.order_index || 0 })),
        ...videoTemplates.map(item => ({ ...item, order_index: item.order_index || 0 }))
      ];
      mediaResources.sort((a, b) => a.order_index - b.order_index);

      // Combine all templates
      setModules([...taskTemplates, ...mediaResources]);
      
      // Return module data for setting title, description, etc.
      return moduleData;
    } catch (err) {
      console.error("Error fetching module data:", err);
      throw err;
    }
  }, []);
  
  return { modules, setModules, fetchModuleData };
};
