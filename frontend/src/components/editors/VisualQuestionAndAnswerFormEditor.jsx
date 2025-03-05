import React, { useState } from 'react';
import axios from 'axios';

const ModuleAndQAForm = () => {
    const [moduleData, setModuleData] = useState({
        title: '',
        description: ''
    });
    const [questionData, setQuestionData] = useState({
        question: '',
        answer: '',
        moduleId: '',  // This will be set after the module is created
    });
    const [error, setError] = useState('');

    const handleModuleChange = (event) => {
        const { name, value } = event.target;
        setModuleData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (event) => {
        const { name, value } = event.target;
        setQuestionData(prev => ({ ...prev, [name]: value }));
    };

    const createModule = async () => {
        try {
            const response = await axios.post('http://localhost:8000/api/modules/', moduleData);
            setQuestionData(prev => ({ ...prev, moduleId: response.data.id })); // Store the module ID
            return response.data.id;
        } catch (error) {
            setError('Failed to create module');
            console.error('Error creating module:', error);
        }
    };

    const createQuestionAnswer = async () => {
        if (!questionData.moduleId) {
            setError('Module ID is required');
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/question_answer_forms/', questionData);
        } catch (error) {
            setError('Failed to create question and answer');
            console.error('Error creating question and answer:', error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const moduleId = await createModule();
        if (moduleId) {
            createQuestionAnswer();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Module</h2>
            <input
                name="title"
                value={moduleData.title}
                onChange={handleModuleChange}
                placeholder="Module Title"
            />
            <textarea
                name="description"
                value={moduleData.description}
                onChange={handleModuleChange}
                placeholder="Module Description"
            />
            <h2>Create Question and Answer</h2>
            <input
                name="question"
                value={questionData.question}
                onChange={handleQuestionChange}
                placeholder="Question"
            />
            <input
                name="answer"
                value={questionData.answer}
                onChange={handleQuestionChange}
                placeholder="Answer"
            />
            <button type="submit">Submit</button>
            {error && <p>{error}</p>}
        </form>
    );
};

export default ModuleAndQAForm;


