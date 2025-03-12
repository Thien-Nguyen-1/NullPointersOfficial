import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import "../../styles/MainQuizContainer.css";
import { FaTrash, FaPencilAlt, FaUpload, FaPlay, FaPause } from "react-icons/fa";

const AdminAudioQuestionForm = ({ onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false); // ==> declare this state variable so that react will not throw a runtime error (using it HandleSubmit)
  const [audioPreview, setAudioPreview] = useState(null);
  const [submittedAudio, setSubmittedAudio] = useState(false); // ==> track if audio is saved/ question is added

  const audioRef = React.useRef(null);

  const handleFileChange = (e) => {
    // Get the selected file from the file input
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) { //If file is not an audio file
        setError("Please select a valid audio file.");
        setAudioFile(null);
        setAudioPreview(null);
        return;
      }

      // Cleanup previous preview if exists
      if (audioPreview && !submittedAudio) {
        URL.revokeObjectURL(audioPreview);
      }

      //If file is valid audio file
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file)); //// Create a temporary URL for audio preview -> create blob URLs (object URL)
      setSubmittedAudio(false); // reset when new file is selected
      setError("");
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    if (!question.trim()) { //Ensures a question is present
      setError("Please enter a question.");
      return;
    }

    if (!audioFile) { //Ensures an audio clip is present
      setError("Please upload an audio file.");
      return;
    }

    setError("");

    // ==> create a new blob URL specifically for the question
    const questionAudioUrl = URL.createObjectURL(audioFile);
    
    onSubmit({
      question_text: question.trim(),
      audio_file: audioFile,
      audio_url: questionAudioUrl
    });

    // ==> mark audio as submitted to prevent revoking its url
    setSubmittedAudio(true);

    // Reset form after submission
    setQuestion("");
    setAudioFile(null);
    setAudioPreview(null);
  };

  useEffect(() => {
    // Cleanup audio preview URL when component unmounts
    return () => {
      // Revoke the object URL to prevent memory leaks
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview]);

  return (
      <div className="module-container">
        <h2 className="module-title">Add Question</h2>
        {error && <p className="error-message">{error}</p>}

        {/* Top row with question, upload button, and add question button */}
        <div className="input-container">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
            className="input-textarea wide-input"
          />

          <label className="audio-upload-label">
            <button onClick={() => document.getElementById("audio-upload").click()}>
              <FaUpload />
              <span>Upload</span>
            </button>

            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          <button onClick={handleSubmit} className="btn-add-question green-button larger-rounded-button">
            Add Question
          </button>
        </div>

        {/* Audio preview row - only shown when an audio file is selected */}
        {audioPreview && (
          <div className="audio-preview-row">
            <div className="audio-preview">
              {/* Standard Audio Controls */}
              <audio controls src={audioPreview} ref={audioRef} />
            </div>
          </div>
        )}
      </div>
    );
};

const AudioQuestionItem = ({ question, index, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question.question_text);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(question.audio_url);
  const [editError, setEditError] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isPlaying, setIsPlaying] = useState(false); // ==> declare this state variable so that react will not throw a runtime error (using it HandleSubmit)
  const audioRef = useRef(null);

  useEffect(() => {
    // Update when question prop changes
    setEditedQuestion(question.question_text);
    setAudioPreview(question.audio_url);
  }, [question]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setEditError("Please select a valid audio file.");
        setAudioFile(null);
        return;
      }

      setAudioFile(file);
      // Revoke previous preview URL if exists
      if (audioPreview && audioPreview !== question.audio_url) {
        URL.revokeObjectURL(audioPreview);
      }

      setAudioPreview(URL.createObjectURL(file));
      setEditError("");
    }
  };


  const handleEdit = () => {
    setIsEditing(true);
    setEditError("");
  };

  const handleSave = () => {
    if (!editedQuestion.trim()) {
      setEditError("Please enter a question.");
      return;
    }

    const updatedQuestion = {
      ...question,
      question_text: editedQuestion
    };

    if (audioFile) {
      updatedQuestion.audio_file = audioFile;
      updatedQuestion.audio_url = audioPreview;
    }

    setEditError("");
    onEdit(index, updatedQuestion);
    setIsEditing(false);
  };

  // ==> handlePlay and handlePause provide control over the audio playback using React's ref system (bevcause React's state management doesnt automatically know or track these)
  // React properties dont directly control the audio elements vehabiours, resulting in not being able to track which audio questions to listen to
  const handlePlay = () => {
    if (audioRef.current) { // checks if the ref is attached to an element 
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // useEffect(() => {
  //   // Cleanup audio preview URL when component unmounts
  //   return () => {
  //     questions.forEach(question => {
  //       if (audioPreview && audioPreview !== question.audio_url) {
  //         URL.revokeObjectURL(audioPreview);
  //       }
  //     });

  //   };
  // }, [audioPreview, question.audio_url]);
  useEffect(() => {
    return () => {
      // Only clean up blob URLs we created in this component (AUDIOQUESTIONITEM)
      if (audioPreview && audioPreview !== question.audio_url && audioPreview.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview, question.audio_url]); // ==> questions doesnt exist in this component 

  return (
    <div className="question-box">
      <div className="question-header">
        <h2 className="question-number">Question {index + 1}</h2>
        <div className="editor-icon-container">
          {isEditing ? (
            <button className="save-button" onClick={handleSave}>Save</button>
          ) : (
            <FaPencilAlt className="edit-icon" onClick={handleEdit} />
          )}
          <FaTrash className="delete-icon" onClick={() => onDelete(index)} />
        </div>
      </div>
      <h3 className="question-subtitle">Audio Question</h3>
      {editError && <p className="error-message">{editError}</p>}

      {isEditing ? (
        <div className="edit-container">
          <textarea
            value={editedQuestion}
            onChange={(e) => setEditedQuestion(e.target.value)}
            className="edit-textarea"
          />

          <div className="audio-upload-container">
            <label className="audio-upload-label">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="file-input"
                style={{ display: 'none' }}
              />
              <div className="upload-button-wrapper">
                <FaUpload className="upload-icon" />
                <span>
                  {audioFile ? audioFile.name : "Update Audio"}
                </span>
              </div>
            </label>
          </div>
          {/* Standard Audio Player in Edit Mode */}
          {audioPreview && (
            <div className="audio-preview">
              <audio controls src={audioPreview} />
            </div>
          )}
        </div>
      ) : (
        <div className="question-content">
          <p className="question-preview">{question.question_text}</p>

          {audioPreview && (
            <div className="audio-preview">
              {/* include the ref function during render */}
              <audio controls src={audioPreview} ref={audioRef} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} /> 
            </div>
          )}

          <div className="answer-container">
            <textarea
              id={`answer-${index}`}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="answer-textarea"
              placeholder="Type your answer here after listening to the audio clip..."
              style={{ width: '100%', minHeight: '80px', boxSizing: 'border-box' }}
            />
          </div>

        </div>
      )}
    </div>
  );
};

const AudioQuestionEditor = forwardRef((props, ref) => {
  const { moduleId, quizType, initialQuestions = [], onUpdateQuestions } = props;
  const [questions, setQuestions] = useState([]);

  // Expose getQuestions method to parent component
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      // Format questions for API compatibility
      return questions.map((question, index) => ({
        id: question.id || Date.now() + index,
        question_text: question.question_text || '',
        audio_file: question.audio_file || null,
        audio_url: question.audio_url || '',
        user_response: "",
        order: index
      }));
    }
  }));

  // Load initial questions if provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      // Format questions for consistency
      const formattedQuestions = initialQuestions.map(q => ({
        id: q.id || Date.now() + Math.random(),
        question_text: q.question_text || q.text || '',
        audio_file: null, // We can't directly load the file object from props
        audio_url: q.audio_url || '',
        order: q.order || 0
      }));

      setQuestions(formattedQuestions);
    } else {
      setQuestions([]);
    }
  }, [initialQuestions]);

  // Update parent component when questions change
  useEffect(() => {
    if (onUpdateQuestions) {
      onUpdateQuestions(questions);
    }
  }, [questions, onUpdateQuestions, moduleId]); // ==> add moduleId so that the questions will always be associated with its own module 

  // after updating the parent component
  // cleanup effect for all blob URLs
  useEffect(() => {
    return () => {
      // Clean up all blob URLs when the editor unmounts
      questions.forEach(question => {
        if (question.audio_url && question.audio_url.startsWith('blob:')) {
          URL.revokeObjectURL(question.audio_url);
        }
      });
    };
  }, [questions]);

  const addQuestion = (newQuestion) => {
    const questionWithId = {
      ...newQuestion,
      id: Date.now() + Math.random()
    };
    setQuestions(prevQuestions => [...prevQuestions, questionWithId]);
  };

  const deleteQuestion = (index) => {

    // Get the question to delete so we can clean up its audio URL
    const questionToDelete = questions[index];
    if (questionToDelete && questionToDelete.audio_url && questionToDelete.audio_url.startsWith('blob:')) {
      URL.revokeObjectURL(questionToDelete.audio_url);
    }

    setQuestions(prevQuestions => prevQuestions.filter((_, i) => i !== index));
  };

  const editQuestion = (index, updatedQuestion) => {
    const updatedQuestions = [...questions];

    // Clean up old audio URL if it's a blob and being replaced
    const oldQuestion = updatedQuestions[index];
    if (oldQuestion.audio_url !== updatedQuestion.audio_url && 
        oldQuestion.audio_url && 
        oldQuestion.audio_url.startsWith('blob:')) {
      URL.revokeObjectURL(oldQuestion.audio_url);
    }

    updatedQuestions[index] = updatedQuestion;
    setQuestions(updatedQuestions);
  };

  return (
    <div className="editor-container">
      <AdminAudioQuestionForm onSubmit={addQuestion} />
      <div className="questions-list">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <AudioQuestionItem
              key={`${moduleId}-question-${index}`}
              index={index}
              question={question}
              onDelete={deleteQuestion}
              onEdit={editQuestion}
            />
          ))
        ) : (
          <div className="no-questions-message">
            <p>No questions added yet. Add a question using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default AudioQuestionEditor;