"use client";
import { useState, useEffect } from 'react';
import { QUESTIONS_DB } from './questions'; // On importe ton grand stock de questions !

const MONEY_TREE = [
  "200 €", "300 €", "500 €", "1 000 €",
  "1 500 €", "2 000 €", "4 000 €", "8 000 €", "12 000 €", "24 000 €", "48 000 €", "72 000 €",
  "150 000 €", "300 000 €", "1 000 000 €"
];

// On crée un type TypeScript pour éviter les erreurs Vercel
type Question = {
  question: string;
  options: string[];
  answer: string;
};

export default function Game() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [jokers, setJokers] = useState({ fiftyFifty: true, phone: true, audience: true });
  
  // Le jeu garde en mémoire les 15 questions tirées au sort pour cette partie
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);

  // Se lance une seule fois au chargement de la page
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // On mélange le grand stock de questions au hasard
    const shuffled = [...QUESTIONS_DB].sort(() => 0.5 - Math.random());
    // On garde uniquement les 15 premières
    setGameQuestions(shuffled.slice(0, 15));
    
    setCurrentLevel(0);
    setJokers({ fiftyFifty: true, phone: true, audience: true });
    resetTurn();
  };

  // Si les questions ne sont pas encore chargées, on affiche un écran d'attente
  if (gameQuestions.length === 0) {
    return <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "2rem" }}>Chargement du jeu...</div>;
  }

  const currentQuestion = gameQuestions[currentLevel];

  const playSound = (type: 'select' | 'win' | 'lose') => {
    const sounds = {
      select: new Audio('/sounds/suspense.mp3'),
      win: new Audio('/sounds/win.mp3'),
      lose: new Audio('/sounds/lose.mp3')
    };
    if (sounds[type]) {
      sounds[type].play().catch(e => console.log("Audio non disponible", e));
    }
  };

  const handleAnswer = (option: string) => {
    if (isChecking) return;
    setSelectedOption(option);
    setIsChecking(true);
    playSound('select');

    setTimeout(() => {
      setCorrectAnswer(currentQuestion.answer);
      if (option === currentQuestion.answer) {
        playSound('win');
        setTimeout(() => {
          setCurrentLevel(currentLevel + 1);
          resetTurn();
        }, 3000);
      } else {
        playSound('lose');
        setTimeout(() => {
          alert("Fin de la partie ! Vous repartez avec " + getSafeHavenValue());
          startNewGame(); // Relance une nouvelle partie avec 15 nouvelles questions !
        }, 3000);
      }
    }, 3000);
  };

  const resetTurn = () => {
    setSelectedOption(null);
    setCorrectAnswer(null);
    setIsChecking(false);
  };

  const getSafeHavenValue = () => {
    if (currentLevel >= 11) return "72 000 €";
    if (currentLevel >= 3) return "1 000 €";
    return "0 €";
  };

  const useJoker = (type: 'fiftyFifty' | 'phone' | 'audience') => {
    if (!jokers[type]) return;
    setJokers({ ...jokers, [type]: false });
    alert(`Joker ${type} utilisé !`);
  };

  const getButtonClass = (option: string) => {
    if (!isChecking && selectedOption === option) return "answer-btn selected";
    if (isChecking && correctAnswer === option) return "answer-btn correct";
    if (isChecking && selectedOption === option && correctAnswer !== option) return "answer-btn wrong";
    if (isChecking && selectedOption === option) return "answer-btn selected";
    return "answer-btn";
  };

  // Si on a dépassé le niveau 14 (15ème question), on gagne !
  if (!currentQuestion) return (
    <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "2rem" }}>
      🏆 Vous avez gagné le MILLION ! 🏆
      <br/>
      <button onClick={startNewGame} style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}>Rejouer</button>
    </div>
  );

  return (
    <div className="game-container">
      <div className="jokers">
        <button className="joker-btn" disabled={!jokers.fiftyFifty} onClick={() => useJoker('fiftyFifty')}>50:50</button>
        <button className="joker-btn" disabled={!jokers.phone} onClick={() => useJoker('phone')}>☎️</button>
        <button className="joker-btn" disabled={!jokers.audience} onClick={() => useJoker('audience')}>👥</button>
      </div>

      <div className="main-board">
        <div className="hexagon-box question-container">
          {currentQuestion.question}
        </div>

        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={getButtonClass(option)}
              onClick={() => handleAnswer(option)}
            >
              <span style={{ color: '#e5b80b', fontWeight: 'bold', marginRight: '10px' }}>
                {String.fromCharCode(65 + index)}:
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="money-tree">
        {MONEY_TREE.map((amount, index) => {
          const isSafeHaven = index === 3 || index === 11;
          const isActive = index === currentLevel;
          
          let className = "gain-level";
          if (isSafeHaven) className += " safe-haven";
          if (isActive) className += " active";

          return (
            <div key={index} className={className}>
              <span>{index + 1} ⯁</span>
              <span>{amount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
