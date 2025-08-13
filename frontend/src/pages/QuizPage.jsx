import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function QuizPage() {
  // Get the text from the state passed from HomePage
  const location = useLocation();
  const text = location.state?.text || ''; 

  // State variables for quiz questions, loading state, and user answers
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});

  const navigate = useNavigate();

  // Function to fetch quiz questions from the backend
  useEffect(() => {
    async function fetchQuizQuestions() {
      try {
        const response = await fetch('http://127.0.0.1:8000/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch quiz questions');
        }
        const data = await response.json();
        setQuestions(data.questions);
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
      } finally {
        setLoading(false);
      }
    };
    if (text) {
      // Only fetch quiz questions if there is text
      fetchQuizQuestions();
    }
  }, [text]);

  // Function to handle answer selection
  const handleAnswerSelect = (questionIndex, answer) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: answer,
    }));
  };

  // Function to submit answers 
  const allAnswered = Object.keys(userAnswers).length === questions.length;
  const handleSubmit = () => {
    navigate('/score', { state: { userAnswers, questions } });
  }

  // Render loading state or quiz questions 
  return (
    <div className="center-container">
      <h1 className="page-title">Your Quiz</h1>
      {loading ? (
        <p>Loading quiz...</p>
      ) : questions.length > 0 ? (
        questions.map((question, questionIndex) => (
          <div key={questionIndex} className="quiz-question">
            <h3>{questionIndex + 1}. {question.question}</h3>
            {question.options.map((option, optionIndex) => (
              <label key={optionIndex} className="quiz-option">  
                <input 
                  type="radio" 
                  name={`question-${questionIndex}`} 
                  value={option} 
                  checked={userAnswers[questionIndex] === option}
                  onChange={() => handleAnswerSelect(questionIndex, option)} 
                />
                {option}
              </label>
          ))}
        </div>
      ))
      ) : (
        <p>No quiz questions available.</p>
      )}
    <br />
    <div>
      <button 
        className="button" 
        onClick={handleSubmit}
        disabled={!allAnswered}
      >
        Submit Answers
      </button>
    </div>
  </div>
  );
}

export default QuizPage;
  