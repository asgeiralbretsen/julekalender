import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useGameScore } from '../hooks/useGameScore';
import Leaderboard from './Leaderboard';
import GameResultsScreen from './GameResultsScreen';

interface Interviewer {
  name: string;
  image: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  role?: string;
}

interface Question {
  questionText: string;
  answers: string[];
  correctAnswerIndex: number;
  timeLimit: number;
}

interface InterviewGameData {
  title: string;
  description: string;
  interviewers: Interviewer[];
  questions: Question[];
  scoringSettings: {
    correctAnswerPoints: number;
    timeBonus: number;
    perfectScoreBonus: number;
  };
}

export default function InterviewGame() {
  const { user } = useUser();
  const { saveGameScore, hasUserPlayedGame, getUserScoreForDay } = useGameScore();
  
  const [gameData, setGameData] = useState<InterviewGameData | null>(null);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingPlayStatus, setCheckingPlayStatus] = useState(true);
  const [currentInterviewer, setCurrentInterviewer] = useState<Interviewer | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const [gotJob, setGotJob] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const gameDataStr = sessionStorage.getItem('currentGameData');
    const dayInfoStr = sessionStorage.getItem('currentDayInfo');

    if (gameDataStr) {
      try {
        const parsed = JSON.parse(gameDataStr);
        if (parsed.interviewGameData) {
          setGameData(parsed.interviewGameData);
          // Set the first interviewer as current
          if (parsed.interviewGameData.interviewers && parsed.interviewGameData.interviewers.length > 0) {
            setCurrentInterviewer(parsed.interviewGameData.interviewers[0]);
          }
        }
      } catch (error) {
        console.error('Error parsing game data:', error);
      }
    }

    if (dayInfoStr) {
      try {
        setDayInfo(JSON.parse(dayInfoStr));
      } catch (error) {
        console.error('Error parsing day info:', error);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const checkIfPlayedToday = async () => {
      if (!user || !dayInfo) {
        setCheckingPlayStatus(false);
        return;
      }

      try {
        const hasPlayed = await hasUserPlayedGame(dayInfo.day, 'interviewGame');
        if (hasPlayed) {
          const previousScoreData = await getUserScoreForDay(dayInfo.day, 'interviewGame');
          setHasPlayedToday(true);
          setPreviousScore(previousScoreData?.score || null);
          setGameEnded(true);
        }
      } catch (err) {
        console.error('Error checking if user has played today:', err);
      } finally {
        setCheckingPlayStatus(false);
      }
    };

    checkIfPlayedToday();
  }, [user, dayInfo, hasUserPlayedGame, getUserScoreForDay]);

  const startGame = () => {
    if (!gameData) return;
    setGameStarted(true);
    setGameEnded(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScoreSaved(false);
    setGotJob(false);
    setFailed(false);
    setStartTime(Date.now());
    setFinalTime(null);
    // Set first interviewer
    if (gameData.interviewers && gameData.interviewers.length > 0) {
      setCurrentInterviewer(gameData.interviewers[0]);
    }
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (selectedAnswer !== null || !gameData) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const question = gameData.questions[currentQuestion];
    const isCorrect = answerIndex === question.correctAnswerIndex;
    
    if (!isCorrect) {
      // Wrong answer = immediate failure
      setFailed(true);
      setTimeout(() => {
        endGame();
      }, 2000);
      return;
    }

    // Correct answer - check if this was the last question
    if (currentQuestion + 1 >= gameData.questions.length) {
      // All questions answered correctly - got the job!
      setGotJob(true);
      setFinalTime(Date.now());
      setTimeout(() => {
        endGame();
      }, 2000);
    } else {
      // Move to next question
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  };

  const nextQuestion = () => {
    if (!gameData) return;

    const nextQuestionIndex = currentQuestion + 1;
    setCurrentQuestion(nextQuestionIndex);
    setSelectedAnswer(null);
    setShowResult(false);
    
    // Switch interviewer for variety (alternate between the two)
    if (gameData.interviewers && gameData.interviewers.length >= 2) {
      setCurrentInterviewer(gameData.interviewers[nextQuestionIndex % 2]);
    }
  };

  const endGame = async () => {
    setGameEnded(true);
    
    if (user && dayInfo && !hasPlayedToday && gotJob && startTime && finalTime) {
      try {
        // Calculate score based on speed (faster = higher score)
        const timeTaken = (finalTime - startTime) / 1000; // seconds
        const maxTime = gameData.questions.length * 30; // Assume 30 seconds per question max
        const speedBonus = Math.max(0, maxTime - timeTaken);
        const finalScore = Math.round(1000 + speedBonus * 10); // Base score + speed bonus

        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: 'interviewGame',
          score: finalScore,
        });
        
        if (result) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(finalScore);
        }
      } catch (err) {
        console.error('Error saving game score:', err);
      }
    }
  };

  if (loading || checkingPlayStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-christmas-lg border-2 border-yellow-400/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300 mx-auto mb-4"></div>
          <p className="text-red-100">Laster intervju...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-christmas-lg border-2 border-yellow-400/20">
          <p className="text-red-100">Ingen intervju-data tilgjengelig</p>
        </div>
      </div>
    );
  }

  if (gameEnded) {
    const displayScore = hasPlayedToday && previousScore !== null ? previousScore : (gotJob ? 1000 : 0);
    const isFirstAttempt = !hasPlayedToday || scoreSaved;

    return (
      <GameResultsScreen
        isFirstAttempt={isFirstAttempt}
        currentScore={gotJob ? 1000 : 0}
        previousScore={previousScore}
        scoreSaved={scoreSaved}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="interviewGame"
        gameName="Intervju Spill"
        onPlayAgain={startGame}
        scoreLabel="poeng"
      />
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-christmas-lg border-2 border-yellow-400/20 relative z-10">
          <h1 className="text-4xl font-bold text-yellow-300 mb-4 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            {dayInfo ? `Dag ${dayInfo.day}: ${dayInfo.title}` : gameData.title}
          </h1>
          
          <p className="text-red-100 mb-6">{gameData.description}</p>
          
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
            <p className="text-red-200 font-semibold mb-2">Intervju-regler:</p>
            <ul className="text-red-100 text-sm space-y-1">
              <li>• {gameData.questions.length} spørsmål</li>
              <li>• 4 svaralternativer hver</li>
              <li>• <span className="text-red-300 font-bold">1 feil = ut av intervjuet!</span></li>
              <li>• <span className="text-green-300 font-bold">Alle riktig = du får jobben!</span></li>
              <li>• Poeng basert på hastighet</li>
              <li>• Første forsøk teller!</li>
            </ul>
          </div>
          
          <button
            onClick={startGame}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-green-500"
          >
            Start intervju
          </button>
        </div>
      </div>
    );
  }

  const question = gameData.questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswerIndex;

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Teams-like background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900" />
      
      {/* Teams call interface */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with meeting info */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-white font-medium">Intervju - {currentInterviewer?.name || 'Laster...'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span>Spørsmål {currentQuestion + 1} / {gameData.questions.length}</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-green-400">🎯 Alle riktig = jobb!</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-red-400">❌ 1 feil = ut!</span>
            </div>
          </div>
        </div>

        {/* Main video area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-6xl w-full">
            <div className="grid lg:grid-cols-3 gap-8 items-center">
              
              {/* Interviewer video (main speaker) */}
              <div className="lg:col-span-2">
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-600">
                  {/* Video placeholder with interviewer */}
                  <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
                    {currentInterviewer && (
                      <div className="text-center">
                        <img
                          src={`https://cdn.sanity.io/images/54fixmwv/production/${currentInterviewer.image.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`}
                          alt={currentInterviewer.image.alt || currentInterviewer.name}
                          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-400 shadow-lg"
                        />
                        <h3 className="text-2xl font-bold text-white mt-4 mb-2">
                          {currentInterviewer.name}
                        </h3>
                        {currentInterviewer.role && (
                          <p className="text-blue-300 text-lg">
                            {currentInterviewer.role}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Speaking indicator */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">Snakker</span>
                    </div>
                  </div>
                  
                  {/* Subtitles */}
                  <div className="bg-black/80 backdrop-blur-sm p-6">
                    <div className="text-center">
                      <p className="text-white text-xl font-medium leading-relaxed">
                        {question.questionText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer options (your responses) */}
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold mb-4 text-center">
                  Ditt svar:
                </h3>
                
                {question.answers.map((answer, index) => {
                  let buttonStyle = 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-white';
                  
                  if (showResult) {
                    if (index === question.correctAnswerIndex) {
                      buttonStyle = 'bg-green-600 border-green-500 text-white';
                    } else if (index === selectedAnswer) {
                      buttonStyle = 'bg-red-600 border-red-500 text-white';
                    } else {
                      buttonStyle = 'bg-gray-600 border-gray-500 text-gray-300';
                    }
                  } else if (selectedAnswer === index) {
                    buttonStyle = 'bg-blue-600 border-blue-500 text-white';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerClick(index)}
                      disabled={selectedAnswer !== null || showResult}
                      className={`w-full p-4 rounded-lg font-medium border-2 transition-all duration-200 ${buttonStyle} disabled:cursor-not-allowed text-left`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                      {answer}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Result overlay */}
        {showResult && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
              {isCorrect ? (
                <div>
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-4">
                    Riktig svar!
                  </h2>
                  {currentQuestion + 1 >= gameData.questions.length ? (
                    <div className="p-4 bg-green-100 rounded-lg">
                      <p className="text-green-800 font-bold text-xl">
                        🎉 Gratulerer! Du fikk jobben!
                      </p>
                      <p className="text-green-600 text-sm mt-2">
                        Poeng basert på hastighet
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Fortsett til neste spørsmål...
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold text-red-600 mb-4">
                    Feil svar!
                  </h2>
                  <div className="p-4 bg-red-100 rounded-lg">
                    <p className="text-red-800 font-bold text-lg">
                      Du ble sendt ut av intervjuet
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
