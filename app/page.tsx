"use client";
import { useState, useEffect, useRef } from 'react';
import { QUESTIONS_DB } from './questions';

const MONEY_TREE = [
  "200 €", "300 €", "500 €", "1 000 €",
  "1 500 €", "2 000 €", "4 000 €", "8 000 €", "12 000 €", "24 000 €", "48 000 €", "72 000 €",
  "150 000 €", "300 000 €", "1 000 000 €"
];

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
  
  // Stockage des 15 questions de la partie en cours
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  
  // Gestion de la musique
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const bgAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialisation sécurisée de la musique (côté client uniquement)
    bgAudio.current = new Audio('/sounds/background.mp3');
    bgAudio.current.loop = true;
    bgAudio.current.volume = 0.2;

    // Lancement de la première partie
    startNewGame();
  }, []);

  const toggleMusic = () => {
    if (bgAudio.current) {
      if (isPlayingMusic) {
        bgAudio.current.pause();
        setIsPlayingMusic(false);
      } else {
        bgAudio.current.play().catch(e => console.log("Erreur audio:", e));
        setIsPlayingMusic(true);
      }
    }
  };

  const startNewGame = () => {
    if (!QUESTIONS_DB || QUESTIONS_DB.length === 0) return;
    
    // On mélange le grand stock de questions et on en garde 15
    const shuffled = [...QUESTIONS_DB].sort(() => 0.5 - Math.random());
    setGameQuestions(shuffled.slice(0, 15));
    
    setCurrentLevel(0);
    setJokers({ fiftyFifty: true, phone: true, audience: true });
    resetTurn();
  };

  const playSound = (type: 'select' | 'win' | 'lose') => {
    try {
      const sounds = {
        select: new Audio('/sounds/suspense.mp3'),
        win: new Audio('/sounds/win.mp3'),
        lose: new Audio('/sounds/lose.mp3')
      };
      if (sounds[type]) {
        sounds[type].volume = 0.8;
        sounds[type].play().catch(e => console.log("Audio non dispo", e));
      }
    } catch (err) {
      console.log("Erreur système audio", err);
    }
  };

  const handleAnswer = (option: string) => {
    if (isChecking) return;
    setSelectedOption(option);
    setIsChecking(true);
    playSound('select');

    setTimeout(() => {
      const currentQ = gameQuestions[currentLevel];
      setCorrectAnswer(currentQ.answer);
      
      if (option === currentQ.answer) {
        playSound('win');
        setTimeout(() => {
          setCurrentLevel(currentLevel + 1);
          resetTurn();
        }, 3000);
      } else {
        playSound('lose');
        setTimeout(() => {
          alert("Fin de la partie ! Vous repartez avec " + getSafeHavenValue());
          startNewGame(); // Relance une nouvelle partie
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

  // Écran de chargement le temps que les questions soient mélangées
  if (gameQuestions.length === 0) {
    return <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "2rem" }}>Chargement du jeu...</div>;
  }

  const currentQuestion = gameQuestions[currentLevel];

  // Écran de victoire si on dépasse la 15ème question
  if (!currentQuestion) return (
    <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "2rem" }}>
      🏆 Vous avez gagné le MILLION ! 🏆
      <br/>
      <button onClick={startNewGame} style={{ marginTop: "30px", padding: "15px 30px", cursor: "pointer", fontSize: "1.2rem", borderRadius: "10px", background: "#e5b80b", border: "2px solid white", color: "black", fontWeight: "bold" }}>Rejouer une partie</button>
    </div>
  );

  return (
    <div className="game-container">
      <div className="jokers">
        <button className="joker-btn" disabled={!jokers.fiftyFifty} onClick={() => useJoker('fiftyFifty')}>50:50</button>
        <button className="joker-btn" disabled={!jokers.phone} onClick={() => useJoker('phone')}>☎️</button>
        <button className="joker-btn" disabled={!jokers.audience} onClick={() => useJoker('audience')}>👥</button>
        
        {/* Bouton de la musique */}
        <button className="joker-btn" onClick={toggleMusic} title="Activer/Désactiver la musique">
          {isPlayingMusic ? '🔊' : '🔇'}
        </button>
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
