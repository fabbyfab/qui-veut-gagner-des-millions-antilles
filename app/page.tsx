"use client";
import { useState, useEffect, useRef } from 'react';
import { QUESTIONS_EASY, QUESTIONS_MEDIUM, QUESTIONS_HARD } from './questions';

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

// NOUVEAU : On définit les différents écrans possibles du jeu
type GameState = 'welcome' | 'playing' | 'safeHaven';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  
  const [jokers, setJokers] = useState({ fiftyFifty: true, phone: true, audience: true });
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const bgAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bgAudio.current = new Audio('/sounds/background.mp3');
    bgAudio.current.loop = true;
    bgAudio.current.volume = 0.2;
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
    const shuffledEasy = [...QUESTIONS_EASY].sort(() => 0.5 - Math.random());
    const shuffledMedium = [...QUESTIONS_MEDIUM].sort(() => 0.5 - Math.random());
    const shuffledHard = [...QUESTIONS_HARD].sort(() => 0.5 - Math.random());

    const finalQuestions = [
      ...shuffledEasy.slice(0, 5),
      ...shuffledMedium.slice(0, 5),
      ...shuffledHard.slice(0, 5)
    ];

    setGameQuestions(finalQuestions);
    setCurrentLevel(0);
    setJokers({ fiftyFifty: true, phone: true, audience: true });
    setHiddenOptions([]);
    resetTurn();
    
    // On affiche l'écran d'accueil et on lance la musique
    setGameState('welcome');
    if (bgAudio.current) {
      bgAudio.current.currentTime = 0;
      // Le navigateur peut bloquer l'audio au premier chargement, on gère l'erreur silencieusement
      bgAudio.current.play().then(() => setIsPlayingMusic(true)).catch(() => setIsPlayingMusic(false));
    }
  };

  // NOUVEAU : Fonction pour quitter un écran d'attente et couper la musique
  const startGame = () => {
    if (bgAudio.current) {
      bgAudio.current.pause();
      setIsPlayingMusic(false);
    }
    setGameState('playing');
  };

  // NOUVEAU : Fonction pour quitter l'écran de palier et passer à la question suivante
  const continueFromSafeHaven = () => {
    if (bgAudio.current) {
      bgAudio.current.pause();
      setIsPlayingMusic(false);
    }
    setCurrentLevel(currentLevel + 1);
    setGameState('playing');
  };

  const playSound = (type: 'select' | 'win' | 'lose' | 'joker') => {
    try {
      const sounds = {
        select: new Audio('/sounds/suspense.mp3'),
        win: new Audio('/sounds/win.mp3'),
        lose: new Audio('/sounds/lose.mp3'),
        joker: new Audio('/sounds/joker.mp3')
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
          // NOUVEAU : On vérifie si on vient de réussir la question 4 (index 3) ou 12 (index 11)
          if (currentLevel === 3 || currentLevel === 11) {
            setGameState('safeHaven');
            if (bgAudio.current) {
              bgAudio.current.currentTime = 0;
              bgAudio.current.play().catch(e => console.log("Erreur audio", e));
              setIsPlayingMusic(true);
            }
          } else {
            setCurrentLevel(currentLevel + 1);
          }
          resetTurn();
        }, 3000);
      } else {
        playSound('lose');
        setTimeout(() => {
          alert("Fin de la partie ! Vous repartez avec " + getSafeHavenValue());
          startNewGame();
        }, 3000);
      }
    }, 3000);
  };

  const resetTurn = () => {
    setSelectedOption(null);
    setCorrectAnswer(null);
    setIsChecking(false);
    setHiddenOptions([]); 
  };

  const getSafeHavenValue = () => {
    if (currentLevel >= 11) return "72 000 €";
    if (currentLevel >= 3) return "1 000 €";
    return "0 €";
  };

  const useFiftyFifty = () => {
    if (!jokers.fiftyFifty || isChecking) return;
    setJokers({ ...jokers, fiftyFifty: false });
    playSound('joker'); 
    
    const currentQ = gameQuestions[currentLevel];
    const wrongOptions = currentQ.options.filter(opt => opt !== currentQ.answer);
    const shuffledWrong = wrongOptions.sort(() => 0.5 - Math.random());
    setHiddenOptions([shuffledWrong[0], shuffledWrong[1]]);
  };

  const usePhone = () => {
    if (!jokers.phone || isChecking) return;
    setJokers({ ...jokers, phone: false });
    playSound('joker'); 
    
    const currentQ = gameQuestions[currentLevel];
    alert(`📞 APPEL À UN AMI :\n\n"Salut ! Écoute, je ne suis pas sûr à 100%, mais je dirais bien que c'est la réponse : ${currentQ.answer}."`);
  };

  const useAudience = () => {
    if (!jokers.audience || isChecking) return;
    setJokers({ ...jokers, audience: false });
    playSound('joker'); 
    
    const currentQ = gameQuestions[currentLevel];
    alert(`👥 AVIS DU PUBLIC :\n\n✔️ ${currentQ.answer} : 72%\n❌ Les autres réponses se partagent les 28% restants.`);
  };

  const getButtonClass = (option: string) => {
    if (!isChecking && selectedOption === option) return "answer-btn selected";
    if (isChecking && correctAnswer === option) return "answer-btn correct";
    if (isChecking && selectedOption === option && correctAnswer !== option) return "answer-btn wrong";
    if (isChecking && selectedOption === option) return "answer-btn selected";
    return "answer-btn";
  };

  if (gameQuestions.length < 15) {
    return <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "1.5rem" }}>
      ⚠️ Attention : Il vous faut au moins 5 questions de chaque niveau dans votre fichier questions.ts !
    </div>;
  }

  // --- ÉCRAN 1 : L'ACCUEIL ---
  if (gameState === 'welcome') {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "white", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", color: "#e5b80b", marginBottom: "10px", textShadow: "2px 2px 4px #000" }}>QUI VEUT GAGNER DES MILLIONS ?</h1>
        <h2 style={{ fontSize: "2rem", marginBottom: "50px" }}>Édition Antilles</h2>
        
        <button onClick={startGame} style={{ padding: "15px 50px", fontSize: "1.5rem", borderRadius: "30px", background: "#e5b80b", border: "2px solid white", color: "black", fontWeight: "bold", cursor: "pointer", marginBottom: "20px", boxShadow: "0px 0px 15px rgba(229, 184, 11, 0.5)" }}>
          START
        </button>

        {/* Bouton de secours si le navigateur empêche la musique de se lancer toute seule */}
        {!isPlayingMusic && (
          <button onClick={toggleMusic} style={{ background: "transparent", color: "white", border: "1px solid white", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", opacity: 0.7 }}>
            🔊 Activer la musique
          </button>
        )}
      </div>
    );
  }

  // --- ÉCRAN 2 : LE PALIER ATTEINT ---
  if (gameState === 'safeHaven') {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "white", textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", color: "#e5b80b", marginBottom: "20px", textShadow: "2px 2px 4px #000" }}>🎉 PALIER ATTEINT ! 🎉</h1>
        <p style={{ fontSize: "1.5rem", marginBottom: "50px" }}>Bravo ! Vous êtes assuré de repartir avec au moins <strong>{MONEY_TREE[currentLevel]}</strong> !</p>
        
        <button onClick={continueFromSafeHaven} style={{ padding: "15px 50px", fontSize: "1.5rem", borderRadius: "30px", background: "#e5b80b", border: "2px solid white", color: "black", fontWeight: "bold", cursor: "pointer", boxShadow: "0px 0px 15px rgba(229, 184, 11, 0.5)" }}>
          START (Question suivante)
        </button>
      </div>
    );
  }

  // --- ÉCRAN 3 : LE JEU EN LUI-MÊME ---
  const currentQuestion = gameQuestions[currentLevel];

  if (!currentQuestion) return (
    <div style={{ color: "white", padding: "50px", textAlign: "center", fontSize: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1 style={{ fontSize: "4rem", color: "#e5b80b" }}>🏆 LE MILLION ! 🏆</h1>
      <p>Félicitations, vous avez remporté le jeu !</p>
      <button onClick={startNewGame} style={{ marginTop: "30px", padding: "15px 30px", cursor: "pointer", fontSize: "1.2rem", borderRadius: "10px", background: "#e5b80b", border: "2px solid white", color: "black", fontWeight: "bold" }}>Rejouer une partie</button>
    </div>
  );

  return (
    <div className="game-container">
      <div className="jokers">
        <button className="joker-btn" disabled={!jokers.fiftyFifty} onClick={useFiftyFifty}>50:50</button>
        <button className="joker-btn" disabled={!jokers.phone} onClick={usePhone}>☎️</button>
        <button className="joker-btn" disabled={!jokers.audience} onClick={useAudience}>👥</button>
        {/* On peut garder ou enlever ce bouton, mais il permet toujours de gérer le son manuel */}
        <button className="joker-btn" onClick={toggleMusic} title="Activer/Désactiver la musique">
          {isPlayingMusic ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="main-board">
        <div className="hexagon-box question-container">
          {currentQuestion.question}
        </div>

        <div className="answers-grid">
          {currentQuestion.options.map((option, index) => {
            if (hiddenOptions.includes(option)) {
              return <div key={index} style={{ visibility: 'hidden' }}></div>;
            }

            return (
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
            );
          })}
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
