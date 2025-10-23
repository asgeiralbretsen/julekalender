import Stocking from "./Stocking";
import { useState, useEffect } from "react";
import ColorPickerNoEyedropper from "./ColorPicker";
import { createClient } from "@sanity/client";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../../hooks/useGameScore";
import { ChristmasBackground } from "../ChristmasBackground";
import GameResultsScreen from "../GameResultsScreen";
import { StartGameScreen } from "../StartGameScreen";

interface Colors {
  topColor: string;
  topStripesColor: string;
  mainColor: string;
  heelColor: string;
  stripesColor: string;
}

interface ColorScore {
  section: string;
  percentage: number;
}

interface GameData {
  title: string;
  description: string;
  stockingColors: Colors;
  scoringSettings: {
    perfectMatchBonus: number;
    closeMatchThreshold: number;
    timeBonus: number;
  };
}

// Initialize Sanity client
const client = createClient({
  projectId: "54fixmwv",
  dataset: "production",
  useCdn: true,
  apiVersion: "2024-01-01",
});

export function ColorMatchGame() {
  const { user } = useUser();
  const {
    saveGameScore,
    hasUserPlayedGame,
    getUserScoreForDay,
    loading: scoreLoading,
    error: scoreError,
  } = useGameScore();

  const [colorPickerColor, setColorPickerColor] = useState("gray");
  const [showResults, setShowResults] = useState(false);
  const [colorScores, setColorScores] = useState<ColorScore[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [gameOver, setGameOver] = useState(false);

  // Original colors from Sanity
  const [originalColors, setOriginalColors] = useState<Colors>({
    topColor: "blue",
    topStripesColor: "red",
    mainColor: "green",
    heelColor: "yellow",
    stripesColor: "purple",
  });

  // Player's current colors
  const [currentColors, setCurrentColors] = useState<Colors>({
    topColor: "gray",
    topStripesColor: "white",
    mainColor: "gray",
    heelColor: "white",
    stripesColor: "white",
  });

  // Load game data from Sanity
  useEffect(() => {
    const loadGameData = async () => {
      try {
        // First, try to get data from sessionStorage (passed from calendar)
        const gameDataStr = sessionStorage.getItem("currentGameData");
        const dayInfoStr = sessionStorage.getItem("currentDayInfo");

        if (gameDataStr) {
          const parsedData = JSON.parse(gameDataStr);
          if (parsedData.colorMatchGameData) {
            const data = parsedData.colorMatchGameData;

            // Set colors from Sanity (now simple strings)
            const stockingColors: Colors = {
              topColor: data.stockingColors?.topColor || "#ff0000",
              topStripesColor:
                data.stockingColors?.topStripesColor || "#800080",
              mainColor: data.stockingColors?.mainColor || "#008000",
              heelColor: data.stockingColors?.heelColor || "#ffff00",
              stripesColor: data.stockingColors?.stripesColor || "#800080",
            };

            setOriginalColors(stockingColors);
            setGameData({
              title: data.title || "Color Match Game",
              description: data.description || "",
              stockingColors: stockingColors,
              scoringSettings: data.scoringSettings || {
                perfectMatchBonus: 50,
                closeMatchThreshold: 80,
                timeBonus: 1.5,
              },
            });
          }
        }

        if (dayInfoStr) {
          try {
            setDayInfo(JSON.parse(dayInfoStr));
          } catch (error) {
            console.error("Error parsing day info:", error);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading game data:", error);
        setLoading(false);
      }
    };

    loadGameData();
  }, []);

  // Check if user has played today
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (dayInfo && user) {
        const hasPlayed = await hasUserPlayedGame(
          dayInfo.day,
          "colorMatchGame"
        );
        if (hasPlayed) {
          const userScore = await getUserScoreForDay(
            dayInfo.day,
            "colorMatchGame"
          );
          setHasPlayedToday(true);
          setPreviousScore(userScore?.score || null);
        }
      }
    };
    checkPlayStatus();
  }, [dayInfo, user, hasUserPlayedGame, getUserScoreForDay]);

  // Timer countdown
  useEffect(() => {
    if (gameStarted && !gameOver && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameOver, timeRemaining]);

  const setSingleColor = (section: keyof Colors, color: string) => {
    setCurrentColors((prev) => ({
      ...prev,
      [section]: color,
    }));
  };

  const hexToRgb = (hex: string) => {
    // Handle both hex and named colors
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { r: 0, g: 0, b: 0 };

    ctx.fillStyle = hex;
    const computedColor = ctx.fillStyle;

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      computedColor
    );
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const calculateColorMatch = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    const maxDistance = Math.sqrt(Math.pow(255, 2) * 3);
    return Math.max(0, 100 - (distance / maxDistance) * 100);
  };

  const submitColors = async () => {
    if (!gameData) return;

    const scores: ColorScore[] = [
      {
        section: "Top Color",
        percentage: calculateColorMatch(
          currentColors.topColor,
          originalColors.topColor
        ),
      },
      {
        section: "Top Stripes",
        percentage: calculateColorMatch(
          currentColors.topStripesColor,
          originalColors.topStripesColor
        ),
      },
      {
        section: "Main Color",
        percentage: calculateColorMatch(
          currentColors.mainColor,
          originalColors.mainColor
        ),
      },
      {
        section: "Heel Color",
        percentage: calculateColorMatch(
          currentColors.heelColor,
          originalColors.heelColor
        ),
      },
      {
        section: "Stripes Color",
        percentage: calculateColorMatch(
          currentColors.stripesColor,
          originalColors.stripesColor
        ),
      },
    ];

    setColorScores(scores);

    const averageScore =
      scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length;

    let finalScore = Math.round(averageScore * 10);

    // Add time bonus
    const timeBonus = Math.round(
      timeRemaining * gameData.scoringSettings.timeBonus
    );
    finalScore += timeBonus;

    // Add perfect match bonus
    const perfectMatches = scores.filter(
      (s) => s.percentage >= gameData.scoringSettings.closeMatchThreshold
    ).length;
    if (perfectMatches === scores.length) {
      finalScore += gameData.scoringSettings.perfectMatchBonus;
    }

    setOverallScore(finalScore);
    setShowResults(true);
    setGameOver(true);

    // Save score if first attempt
    if (user && dayInfo && !hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "colorMatchGame",
          score: finalScore,
        });

        if (result) {
          setScoreSaved(true);
          setPreviousScore(result.score);
        }
      } catch (err) {
        console.error("Error saving game score:", err);
      }
    }
  };

  const resetGame = () => {
    setCurrentColors({
      topColor: "gray",
      topStripesColor: "white",
      mainColor: "gray",
      heelColor: "white",
      stripesColor: "white",
    });
    setShowResults(false);
    setColorScores([]);
    setOverallScore(0);
    setGameStarted(false);
    setTimeRemaining(45);
    setGameOver(false);
    setScoreSaved(false);
  };

  const startGame = () => {
    setGameStarted(true);
    setTimeRemaining(45);
    setGameOver(false);
  };

  if (loading) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <p className="text-white text-xl">Laster spill...</p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  if (!gameData) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
            <p className="text-white text-xl">Ingen spilldata funnet.</p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  // Show results screen after game ends
  if (gameOver && showResults && dayInfo) {
    return (
      <GameResultsScreen
        isFirstAttempt={!hasPlayedToday || scoreSaved}
        currentScore={overallScore}
        previousScore={previousScore}
        scoreSaved={scoreSaved}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="colorMatchGame"
        gameName="Color Match"
        onPlayAgain={resetGame}
        scoreLabel="poeng"
      />
    );
  }

  // Show start screen
  if (!gameStarted) {
    return (
      <StartGameScreen
        title={
          dayInfo ? `Dag ${dayInfo.day}: ${dayInfo.title}` : gameData.title
        }
        description={
          gameData.description ||
          "Match fargene på julestrømpa så nøyaktig som mulig!"
        }
        howToPlay={[
          "• Velg en farge fra fargepaletten",
          "• Klikk på en del av sokken for å sette fargen",
          "• Match alle 5 farger så nøyaktig som mulig",
          "• 45 sekunder til å fullføre",
          "• Jo nærmere match, desto flere poeng!",
        ]}
        previousScore={hasPlayedToday ? previousScore : undefined}
        onClickStartGame={startGame}
      />
    );
  }

  return (
    <ChristmasBackground>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {dayInfo
                ? `Dag ${dayInfo.day}: ${dayInfo.title}`
                : gameData.title}
            </h1>
            <div className="flex justify-center gap-8 text-white/80">
              <span>Tid: {timeRemaining}s</span>
              {showResults && <span>Poeng: {overallScore}</span>}
            </div>
          </div>

          {/* Main Game Area */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Original Stocking (Target) */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Målsokk
              </h2>
              <div className="flex justify-center">
                <Stocking
                  topColor={originalColors.topColor}
                  topStripesColor={originalColors.topStripesColor}
                  mainColor={originalColors.mainColor}
                  heelColor={originalColors.heelColor}
                  stripesColor={originalColors.stripesColor}
                />
              </div>
            </div>

            {/* Player Stocking */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white text-center mb-4">
                Din sokk
              </h2>
              <div className="flex justify-center">
                <Stocking
                  topColor={currentColors.topColor}
                  topStripesColor={currentColors.topStripesColor}
                  mainColor={currentColors.mainColor}
                  heelColor={currentColors.heelColor}
                  stripesColor={currentColors.stripesColor}
                  onClickTopColor={() => {
                    setSingleColor("topColor", colorPickerColor);
                  }}
                  onClickTopStripesColor={() => {
                    setSingleColor("topStripesColor", colorPickerColor);
                  }}
                  onClickMainColor={() => {
                    setSingleColor("mainColor", colorPickerColor);
                  }}
                  onClickHeelColor={() => {
                    setSingleColor("heelColor", colorPickerColor);
                  }}
                  onClickStripesColor={() => {
                    setSingleColor("stripesColor", colorPickerColor);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="mt-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-white text-center mb-4 font-semibold">
                Velg farge
              </h3>
              <ColorPickerNoEyedropper
                value={colorPickerColor}
                onChange={(color) => setColorPickerColor(color)}
              />
            </div>
          </div>

          {/* Submit Button */}
          {!showResults && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={submitColors}
                disabled={gameOver}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-full font-bold text-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send inn farger
              </button>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white text-center mb-6">
                Resultater
              </h2>
              <div className="space-y-4">
                {colorScores.map((score, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-lg p-4 flex justify-between items-center"
                  >
                    <span className="text-white font-semibold">
                      {score.section}
                    </span>
                    <span className="text-white">
                      {score.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-3xl font-bold text-yellow-300">
                  Total: {overallScore} poeng
                </p>
                {scoreSaved && (
                  <p className="text-green-300 mt-2">Poengsum lagret!</p>
                )}
                {hasPlayedToday && !scoreSaved && (
                  <p className="text-yellow-300 mt-2">
                    Øvingsrunde - Poengsum ikke lagret
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ChristmasBackground>
  );
}
