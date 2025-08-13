import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ScorePage() {
  // Get the user answers and questions from the state passed from QuizPage
  const location = useLocation();
  const userAnswers = location.state?.userAnswers || {};
  const questions = location.state?.questions || [];

  const navigate = useNavigate();

  // State variable for scoring results
  const [loading, setLoading] = useState(true);
  const [scoreResult, setScoreResult] = useState({});

  // Function to fetch score from the backend
  useEffect(() => {
    // Create payload for scoring
    const payload = {
      questions: questions.map((question, index) => ({
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        user_answer: userAnswers[index] || '',
      })),
    }

    async function fetchScore() {
      try {
        const response = await fetch('http://127.0.0.1:8000/check-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch score');
        }
        const data = await response.json();
        setScoreResult(data);
      } catch (error) {
        console.error('Error fetching score:', error);
      } finally {
        setLoading(false);
      }
    }
    if (questions.length > 0) {
      // Only fetch score if there are questions
      fetchScore();
    }}, []);

    // Render loading state or score result
    return (
    <div className="center-container">
      <h1>Your Results</h1>
      {loading ? (
        <p>Scoring...</p>
      ) : (
        <div className = "score-container">
          <h2 className = "score-header">Score: {scoreResult.score}/{scoreResult.total}</h2>
          {scoreResult.results.map((result, index) => (
            <div key={index} className={result.is_correct === 'Correct' ? 'correct' : 'incorrect'}>
              <p><strong>{index + 1}. </strong> {result.question}</p>
              <p><strong>Your Answer:</strong> {result.user_answer}</p>
              <p><strong>Correct Answer:</strong> {result.correct_answer}</p>
            </div>
          ))}
        </div>
      )}
      <button className="button" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}
  export default ScorePage;
  