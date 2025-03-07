import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/VisualMatchingQuestionsEditor.css';

const VisualMatchingQuestionsQuizEditor = () => {
    const apiUrl = 'http://localhost:8000/api/matching_questions/';
    const [pairs, setPairs] = useState([]);
    const [newPair, setNewPair] = useState({ question: '', answer: '', moduleID: '' });
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/modules/');
                setModules(response.data);
            } catch (error) {
                setError('Failed to fetch modules');
                console.error('Error fetching modules:', error);
            }
        };
        fetchModules();
    }, []);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewPair({ ...newPair, [name]: value });
    };

    const handleModuleChange = (event) => {
        const moduleIDInt = parseInt(event.target.value, 10);
        setSelectedModuleId(moduleIDInt);
        setNewPair(prev => ({ ...prev, moduleID: moduleIDInt }));
    };

    const handleAddPair = async (event) => {
        event.preventDefault();
        try {
            const completeData = {
                ...newPair,
                title: 'Matching Question Quiz',
                description: 'A Quiz for entering matching pairs.',
                is_published: true,
                author: 1
            };
            const response = await axios.post(apiUrl, completeData);
            setPairs([...pairs, response.data]);  // Assume response.data includes contentID.
            setNewPair({ question: '', answer: '', moduleID: selectedModuleId });
            setError('');
        } catch (err) {
            setError('Failed to save the pair. Please try again.');
            console.error('Error adding pair:', err);
        }
    };

    const handleRemoveEntry = async (contentID) => {
        try {
            await axios.delete(`${apiUrl}${contentID}/`);
            const updatedPairs = pairs.filter(pair => pair.contentID !== contentID);
            setPairs(updatedPairs);
        } catch (error) {
            setError(`Failed to delete the pair: ${error.message}`);
            console.error('Error deleting the pair:', error);
        }
    };

    return (
       <div className="matching-quiz-editor">
            <h1>Create Matching Question and Answer Pairs</h1>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleAddPair} className="pair-form">
                <select onChange={handleModuleChange} value={selectedModuleId || ''}>
                    <option value="">Select correct Module</option>
                    {modules.map((module) => (
                        <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                </select>
                
                    <div className='pair-question'>
                <input
                    type="text"
                    name="question"
                    value={newPair.question}
                    onChange={handleInputChange}
                    placeholder="Question"
                    required
                />
                </div>
                <div className='pair-answer'>
                <input
                    type="text"
                    name="answer"
                    value={newPair.answer}
                    onChange={handleInputChange}
                    placeholder="Answer"
                    required
                />
                </div>
                <button type="submit" className='button'>Add Pair</button>
                
            </form>
            <div className="pairs-list">
                {pairs.map((pair,index) => (
                    <div key={pair.contentID} className="pair-container">
                        <div className="pair-title">Pair {index + 1}</div> 
                        <div className='pair-question'>
                        <p><strong>Question {index + 1}:</strong> {pair.question}</p>
                        </div>
                        <div className='pair-answer'>
                        <p><strong>Answer {index + 1}:</strong> {pair.answer}</p>
                        </div>
                        <button onClick={() => handleRemoveEntry(pair.contentID)} className='button'>Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualMatchingQuestionsQuizEditor;








