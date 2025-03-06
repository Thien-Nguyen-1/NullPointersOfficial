import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/VisualQuestionAndAnswerFormEditor.css';

const VisualQuestionAndAnswerFormEditor = () => {
    const authorId = 1;  
    const [modules, setModules] = useState([]);  
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [questionData, setQuestionData] = useState({
        title: 'Question and Answer Form',  
        description: 'A form for entering Q&A pairs.', 
        question: '',
        answer: '',
        is_published: true,
        moduleID: '',  
        author: authorId
    });
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

    const handleQuestionChange = (event) => {
        const { name, value } = event.target;
        setQuestionData(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleChange = (event) => {
        const moduleIDInt = parseInt(event.target.value, 10); // Convert to integer
        setSelectedModuleId(moduleIDInt); // Store as integer
        setQuestionData(prev => ({ ...prev, moduleID: moduleIDInt })); // Set as integer, using "moduleID"
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            console.log("Submitting with data:", questionData);
            await axios.post('http://localhost:8000/api/question_answer_forms/', questionData);
        } catch (error) {
            setError('Failed to create question and answer');
            console.error('Error creating question and answer:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Question and Answer</h2>
            <select value={selectedModuleId} onChange={handleModuleChange}>
                <option value="">Select a Module</option>
                {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                        {module.title}
                    </option>
                ))}
            </select>
            <input
                name="question"
                value={questionData.question}
                onChange={handleQuestionChange}
                placeholder="Question"
                required
            />
            <input
                name="answer"
                value={questionData.answer}
                onChange={handleQuestionChange}
                placeholder="Answer"
                required
            />
            <button type="submit">Submit</button>
            {error && <p>{error}</p>}
        </form>
    );
};

export default VisualQuestionAndAnswerFormEditor;








