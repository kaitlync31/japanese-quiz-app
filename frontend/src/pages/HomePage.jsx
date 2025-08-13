import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

function HomePage() {
    const [text, setText] = useState('');
    const navigate = useNavigate();

    const handleGenerateQuiz = () => {
        navigate('/quiz', { state: { text } });
    };
    return (
        <div className="center-container">
            <h1 className="page-title">読むクイズ</h1>
            <p className="page-description">Test your Japanese reading comprehension</p>
            <textarea
                value={text} 
                onChange={(e) => setText(e.target.value)}
                rows="20"
                cols="70"
                placeholder="Enter Japanese text here"
            />
            <br />
            <button className="button" onClick={handleGenerateQuiz}>Generate Quiz</button>
        </div>
    )
  }
  export default HomePage;
  