import React from 'react'
import './Tags.css'; 
const predefinedTags = [
    { id: 1, name: 'Unmotivated', description: 'unsure of identity at work' },
    { id: 2, name: 'Stuck', description: 'not knowing values' },
    { id: 3, name: 'Unclear Strengths', description: 'not knowing their strengths' },
    { id: 4, name: 'Uncertain Future Plans', description: 'unsure of what their future plans are' },
    { id: 5, name: 'Low Self-Esteem', description: 'low-self' }
  ];

 const Tags = () => {
    return(
        <div>
            <h1>Tags that will be used to determine which module to take out of the 5 modules (ordered) </h1>
      <ul>
        {predefinedTags.map(tag => (
          <li key={tag.id}>
            <strong>{tag.name}</strong> - {tag.description}
          </li>
        ))}
      </ul>
        </div>
    ); 

 }; 
 export default Tags