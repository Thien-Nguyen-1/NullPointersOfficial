import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/VisualMatchingQuestionsEditor.css';

const VisualMatchingQuestionsQuizEditor = () => {
    const authorId = 1;
    const apiUrl = 'http://localhost:8000/api/matching_questions/';
    const [pairs, setPairs] = useState([]);
    const [newPair, setNewPair] = useState({ question: '', answer: '', moduleID: '' });
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [error, setError] = useState('');
    const qaEditorRef = useRef(null);

    // Fetch all modules on component mount
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

    // Handle changes in input fields
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setNewPair({ ...newPair, [name]: value });
    };

    const handleModuleChange = (event) => {
        const moduleIDInt = parseInt(event.target.value, 10);
        setSelectedModuleId(moduleIDInt);
        setNewPair(prev => ({ ...prev, moduleID: moduleIDInt }));
    };
    // Handle adding a new pair
    const handleAddPair = async (event) => {
        event.preventDefault();
        // if (!newPair.question || !newPair.answer || !newPair.moduleId) {
        //     setError('All fields including module selection are required.');
        //     return;
        // }

        try {
            const completeData = {
                ...newPair,
               title: 'Matching Question Quiz',
               description: 'A Quiz for entering matching pairs.',
               is_published: true,
               author: authorId
            };
            const response = await axios.post(apiUrl, completeData);
            setPairs([...pairs, response.data]);
            setNewPair({ question: '', answer: '', moduleId: selectedModuleId }); // Reset form but keep selected moduleId
            setError('');
        } catch (err) {
            setError('Failed to save the pair. Please try again.');
            console.error('Error adding pair:', err);
        }
    };

    // // Handle module change
    // const handleModuleChange = (event) => {
    //     setSelectedModuleId(event.target.value);
    //     setNewPair(prev => ({ ...prev, moduleId: event.target.value }));
    // };

    return (
        <div ref={qaEditorRef} className="matching-quiz-editor">
            <h1>Create Matching Question and Answer Pairs</h1>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleAddPair} className="pair-form">
                <select onChange={handleModuleChange} value={selectedModuleId || ''}>
                    <option value="">Select a Module</option>
                    {modules.map((module) => (
                        <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                </select>
                <input
                    type="text"
                    name="question"
                    value={newPair.question}
                    onChange={handleInputChange}
                    placeholder="Enter question"
                    required
                />
                <input
                    type="text"
                    name="answer"
                    value={newPair.answer}
                    onChange={handleInputChange}
                    placeholder="Enter matching answer"
                    required
                />
                <button type="submit">Add Pair</button>
            </form>
            <div className="pairs-list">
                {pairs.map((pair, index) => (
                    <div key={index} className="pair">
                        <p><strong>Question:</strong> {pair.question}</p>
                        <p><strong>Answer:</strong> {pair.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualMatchingQuestionsQuizEditor;






