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

interface SanityColorData {
  hex: string;
  hsl: { h: number; s: number; l: number };
  hsv: { h: number; s: number; v: number };
  rgb: { r: number; g: number; b: number };
}

interface GameData {
  title: string;
  description: string;
  stockingColors: {
    topColor: SanityColorData;
    topStripesColor: SanityColorData;
    mainColor: SanityColorData;
    heelColor: SanityColorData;
    stripesColor: SanityColorData;
  };
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [gameOver, setGameOver] = useState(false);

  const [originalColors, setOriginalColors] = useState<Colors>({
    topColor: "blue",
    topStripesColor: "red",
    mainColor: "green",
    heelColor: "yellow",
    stripesColor: "purple",
  });
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

            // Convert Sanity color data to hex strings
            const stockingColors = {
              topColor: data.stockingColors?.topColor?.hex || "#ff0000",
              topStripesColor:
                data.stockingColors?.topStripesColor?.hex || "#800080",
              mainColor: data.stockingColors?.mainColor?.hex || "#008000",
              heelColor: data.stockingColors?.heelColor?.hex || "#ffff00",
              stripesColor: data.stockingColors?.stripesColor?.hex || "#800080",
            };

            setOriginalColors(stockingColors);
            setGameData({
              title: data.title || "Color Match Game",
              description: data.description || "",
              stockingColors: data.stockingColors,
              scoringSettings: data.scoringSettings || {
                perfectMatchBonus: 50,
                closeMatchThreshold: 80,
                timeBonus: 1.5,
              },
            });
          }
        } else {
          // Fallback: fetch from Sanity directly
          const query = `*[_type == "day" && gameType == "colorMatchGame" && isUnlocked == true][0]{
            title,
            colorMatchGameData {
              title,
              description,
              stockingColors {
                topColor,
                topStripesColor,
                mainColor,
                heelColor,
                stripesColor
              },
              scoringSettings {
                perfectMatchBonus,
                closeMatchThreshold,
                timeBonus
              }
            }
          }`;

          const result = await client.fetch(query);
          if (result?.colorMatchGameData) {
            const data = result.colorMatchGameData;
            const stockingColors = {
              topColor: data.stockingColors?.topColor?.hex || "#ff0000",
              topStripesColor:
                data.stockingColors?.topStripesColor?.hex || "#800080",
              mainColor: data.stockingColors?.mainColor?.hex || "#008000",
              heelColor: data.stockingColors?.heelColor?.hex || "#ffff00",
              stripesColor: data.stockingColors?.stripesColor?.hex || "#800080",
            };

            setOriginalColors(stockingColors);
            setGameData({
              title: data.title || "Color Match Game",
              description: data.description || "",
              stockingColors: data.stockingColors,
              scoringSettings: data.scoringSettings || {
                perfectMatchBonus: 50,
                closeMatchThreshold: 80,
                timeBonus: 1.5,
              },
            });
          }
        }

        if (dayInfoStr) {
          setDayInfo(JSON.parse(dayInfoStr));
        }
      } catch (error) {
        console.error("Error loading game data:", error);
        // Keep default colors as fallback
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, []);

  // Game timer - counts down from 45 seconds
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

  useEffect(() => {
    const checkIfPlayedToday = async () => {
      if (!user || !dayInfo) return;

      try {
        const hasPlayed = await hasUserPlayedGame(
          dayInfo.day,
          "colorMatchGame"
        );
        if (hasPlayed) {
          const previousScoreData = await getUserScoreForDay(
            dayInfo.day,
            "colorMatchGame"
          );
          setHasPlayedToday(true);
          setPreviousScore(previousScoreData?.score || null);
          setShowLeaderboard(true); // Show leaderboard immediately if already played
          setShowResultsScreen(true); // Show results screen immediately if already played
        }
      } catch (err) {
        console.error("Error checking if user has played today:", err);
      }
    };

    checkIfPlayedToday();
  }, [user, dayInfo, hasUserPlayedGame, getUserScoreForDay]);

  const setSingleColor = (
    whichColor:
      | "topColor"
      | "topStripesColor"
      | "mainColor"
      | "heelColor"
      | "stripesColor",
    color: string
  ) => {
    // Only allow color changes if game is started and not over
    if (!gameStarted || gameOver) return;

    setCurrentColors({
      ...currentColors,
      [whichColor]: color,
    });
  };

  const hexToRgb = (hex: string) => {
    // Handle named colors
    const colorMap: { [key: string]: string } = {
      red: "#ff0000",
      blue: "#0000ff",
      green: "#008000",
      yellow: "#ffff00",
      purple: "#800080",
      orange: "#ffa500",
      pink: "#ffc0cb",
      brown: "#a52a2a",
      gray: "#808080",
      white: "#ffffff",
      black: "#000000",
    };

    const normalizedHex = colorMap[hex.toLowerCase()] || hex;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      normalizedHex
    );
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const calculateColorDifference = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );

    // Normalize to 0-100 percentage (higher is better)
    return Math.max(0, 100 - distance / 4.41);
  };

  const calculateScores = async () => {
    const sections = [
      { key: "topColor", name: "Top Color" },
      { key: "topStripesColor", name: "Top Stripes" },
      { key: "mainColor", name: "Main Color" },
      { key: "heelColor", name: "Heel Color" },
      { key: "stripesColor", name: "Stripes Color" },
    ];

    const scores: ColorScore[] = sections.map((section) => {
      const percentage = calculateColorDifference(
        originalColors[section.key as keyof Colors],
        currentColors[section.key as keyof Colors]
      );

      const perfectMatchBonus =
        gameData?.scoringSettings?.perfectMatchBonus || 0;
      const adjustedPercentage =
        percentage === 100
          ? Math.min(100, percentage + perfectMatchBonus / 10)
          : percentage;

      return {
        section: section.name,
        percentage: Math.round(adjustedPercentage),
      };
    });

    const averageScore = Math.round(
      scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length
    );

    setColorScores(scores);
    setOverallScore(averageScore);
    setShowResults(true);

    if (user && dayInfo && !hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "colorMatchGame",
          score: averageScore,
        });

        if (result && result.score === averageScore) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(averageScore);
          setShowLeaderboard(true); // Show leaderboard after first submission
        }
      } catch (err) {
        console.error("Error saving game score:", err);
      }
    }
  };

  // Show results screen if user has already played
  if (showResultsScreen) {
    return (
      <GameResultsScreen
        isFirstAttempt={false}
        currentScore={0}
        previousScore={previousScore}
        scoreSaved={true}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="colorMatchGame"
        gameName="Fargetilpasning"
        onPlayAgain={() => setShowResultsScreen(false)}
        scoreLabel="%"
        scoreSuffix="%"
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className=" p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Laster spill...
          </h1>
          <p className="text-white/80">
            Forbereder fargetilpasningsutfordringen din!
          </p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <StartGameScreen
        title={
          dayInfo
            ? `Dag ${dayInfo.day}: ${dayInfo.title}`
            : gameData?.title || "🎨 Sokk fargetilpasning"
        }
        description={
          gameData?.description || "Klikk på sokkedelene for å farge dem!"
        }
        previousScore={previousScore}
        onClickStartGame={() => setGameStarted(true)}
      />
    );
  }

  return (
    <ChristmasBackground>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-white/80 text-lg">
            {gameData?.description || "Klikk på sokkedelene for å farge dem!"}
          </p>

          {/* Timer and Start Button */}
          {!showResults && (
            <div className="mt-6 flex flex-col items-center gap-4">
              {!gameStarted && !gameOver && (
                <button
                  onClick={() => setGameStarted(true)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-8 rounded-lg transition-colors shadow-lg"
                >
                  🎮 Start Spillet (45 sekunder)
                </button>
              )}

              {gameStarted && !gameOver && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border-2 border-yellow-400/20">
                  <p className="text-yellow-300 font-bold text-sm mb-1">
                    Tid Igjen
                  </p>
                  <p
                    className={`text-4xl font-bold ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}
                  >
                    {timeRemaining}s
                  </p>
                </div>
              )}

              {gameOver && !showResults && (
                <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
                  <p className="text-red-200 text-xl font-bold text-center">
                    ⏰ Tiden er ute! Sjekk resultatet ditt.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Stockings */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Target Stocking */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white text-center">
                  Målsokk
                </h2>
                <div className="flex justify-center">
                  <div className="rounded-2xl p-4">
                    <Stocking
                      topColor={originalColors.topColor}
                      topStripesColor={originalColors.topStripesColor}
                      mainColor={originalColors.mainColor}
                      heelColor={originalColors.heelColor}
                      stripesColor={originalColors.stripesColor}
                    />
                  </div>
                </div>
              </div>

              {/* Player Stocking */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white text-center">
                  Din sokk
                </h2>
                <div className="flex justify-center">
                  <div className=" rounded-2xl p-4">
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
            </div>
          </div>

          {/* Right Side - Control Panel */}
          <div className="lg:col-span-1">
            <div className="p-6 sticky top-4">
              {/* Color Picker Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  🎨 Fargevelger
                </h3>
                {!gameStarted && !gameOver && (
                  <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-400/50 rounded-lg">
                    <p className="text-yellow-200 text-xs text-center">
                      ⚠️ Start spillet for å velge farger
                    </p>
                  </div>
                )}
                {gameOver && !showResults && (
                  <div className="mb-3 p-2 bg-red-500/20 border border-red-400/50 rounded-lg">
                    <p className="text-red-200 text-xs text-center">
                      ⏰ Tiden er ute
                    </p>
                  </div>
                )}
                <ColorPickerNoEyedropper
                  value={colorPickerColor}
                  onChange={(color: string) => setColorPickerColor(color)}
                />

                {/* Current Color Preview */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-white text-sm font-medium">Valgt:</div>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: colorPickerColor }}
                  />
                  <div className="text-white text-sm font-mono">
                    {colorPickerColor}
                  </div>
                </div>
              </div>

              {/* Done Button */}
              <div className="mb-6">
                <button
                  onClick={calculateScores}
                  disabled={!gameStarted}
                  className={`w-full px-6 py-3 rounded-full font-semibold transition-all duration-300 transform ${
                    gameStarted
                      ? "bg-gradient-to-r from-red-500 to-green-500 text-white hover:from-red-600 hover:to-green-600 hover:scale-105 cursor-pointer"
                      : "bg-gray-500 text-gray-300 cursor-not-allowed opacity-50"
                  }`}
                >
                  ✅ Ferdig - Sjekk fargene mine!
                </button>
              </div>

              {/* Results Section */}
              {showResults && (
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Dine resultater
                  </h3>

                  {/* Overall Score */}
                  <div className="text-center mb-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-christmas-lg border-2 border-red-400/20">
                    <div className="text-3xl font-bold text-white mb-2">
                      {overallScore}%
                    </div>
                    <p className="text-white/80 text-sm">
                      {scoreSaved ? "Innsendt poengsum" : "Total nøyaktighet"}
                    </p>
                  </div>

                  {scoreSaved && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                      <p className="text-red-200 text-center text-sm">
                        ✅ Poengsum lagret på topplisten!
                      </p>
                    </div>
                  )}

                  {!scoreSaved && hasPlayedToday && previousScore !== null && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                      <p className="text-red-200 text-xs mb-1">
                        Øvingsrunde - Poengsum ikke lagret
                      </p>
                      <p className="text-white/80 text-xs">
                        Din innsendte poengsum:{" "}
                        <span className="font-bold text-red-300">
                          {previousScore}%
                        </span>
                      </p>
                    </div>
                  )}

                  {scoreLoading && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                      <p className="text-red-200 text-center text-sm">
                        💾 Lagrer poengsum...
                      </p>
                    </div>
                  )}

                  {scoreError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-200 text-xs">{scoreError}</p>
                    </div>
                  )}

                  {/* Individual Scores */}
                  <div className="space-y-3">
                    {colorScores.map((score, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white text-sm font-medium">
                            {score.section}
                          </span>
                          <span className="text-white font-bold">
                            {score.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${score.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Try Again Button */}
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setColorScores([]);
                        setOverallScore(0);
                        setScoreSaved(false);
                        setShowLeaderboard(false); // Hide leaderboard when playing again
                        setGameStarted(false);
                        setGameOver(false);
                        setTimeRemaining(45);
                        setCurrentColors({
                          topColor: "gray",
                          topStripesColor: "white",
                          mainColor: "gray",
                          heelColor: "white",
                          stripesColor: "white",
                        });
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                    >
                      {hasPlayedToday
                        ? "🔄 Spill igjen (for moro skyld)"
                        : "🔄 Prøv igjen"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
}
