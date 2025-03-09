import React from 'react'
import '../styles/Tags.css'; 
const predefinedTags = [
    { id: 1, name: 'Unmotivated', description: 'unsure of identity at work' },
    { id: 2, name: 'Stuck', description: 'not knowing values' },
    { id: 3, name: 'Unclear Strengths', description: 'not knowing their strengths' },
    { id: 4, name: 'Uncertain Future', description: 'unsure of what their future plans are' },
    { id: 5, name: 'Low Self-Esteem', description: 'low-self' }
  ];

const Tags = () => {
    return (
        <div className="tags-container">
            <h1>Predefined Tags</h1>
            {predefinedTags.map(tag => (
                <div className="tag" key={tag.id}>
                    {tag.name}
                </div>
            ))}
        </div>
    );
};
 export default Tags