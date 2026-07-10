"use client";
import { useState } from 'react';

const MONEY_TREE = [
  "200 €", "300 €", "500 €", "1 000 €",
  "1 500 €", "2 000 €", "4 000 €", "8 000 €", "12 000 €", "24 000 €", "48 000 €", "72 000 €",
  "150 000 €", "300 000 €", "1 000 000 €"
];

const QUESTIONS_DB = [
  {
    question: "Quel fruit épineux et odorant appelle-t-on 'Zaboka' en créole ?",
    options: ["L'avocat", "Le corossol", "La goyave", "Le fruit à pain"],
    answer: "L'avocat"
  },
  {
    question: "Quelle île de la Guadeloupe est célèbre pour son tourment d'amour ?",
    options: ["Marie-Galante", "La Désirade", "Terre-de-Haut", "Grande-Terre"],
    answer: "Terre-de-Haut"
  },
  {
    question: "En quelle année a eu lieu l'éruption de la Montagne Pelée en Martinique ?",
    options: ["1898", "1902", "1914", "1928"],
    answer: "1902"
  }
];

export default function Game() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [jokers, setJokers] = useState({ fiftyFifty: true, phone: true, audience: true });

  const currentQuestion = QUESTIONS_DB[currentLevel];

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
          setCurrentLevel(0);
          resetTurn();
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

  if (!currentQuestion) return <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "2rem" }}>🏆 Vous avez gagné le MILLION ! 🏆</div>;

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
