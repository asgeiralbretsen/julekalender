import Stocking from "./Stocking";
import { useState, useEffect } from "react";
import ColorPickerNoEyedropper from "./ColorPicker";
import { createClient } from "@sanity/client";
import { useUser } from '@clerk/clerk-react';
import { useGameScore } from '../../hooks/useGameScore';
import Leaderboard from '../Leaderboard';

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
  const { saveGameScore, hasUserPlayedGame, getUserScoreForDay, loading: scoreLoading, error: scoreError } = useGameScore();
  
  const [colorPickerColor, setColorPickerColor] = useState("gray");
  const [showResults, setShowResults] = useState(false);
  const [colorScores, setColorScores] = useState<ColorScore[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );

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

  useEffect(() => {
    const checkIfPlayedToday = async () => {
      if (!user || !dayInfo) return;

      try {
        const hasPlayed = await hasUserPlayedGame(dayInfo.day, 'colorMatchGame');
        if (hasPlayed) {
          const previousScoreData = await getUserScoreForDay(dayInfo.day, 'colorMatchGame');
          setHasPlayedToday(true);
          setPreviousScore(previousScoreData?.score || null);
        }
      } catch (err) {
        console.error('Error checking if user has played today:', err);
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
          gameType: 'colorMatchGame',
          score: averageScore,
        });
        
        if (result && result.score === averageScore) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(averageScore);
        }
      } catch (err) {
        console.error('Error saving game score:', err);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className=" p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Loading Game...
          </h1>
          <p className="text-white/80">
            Preparing your color matching challenge!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {dayInfo
              ? `Day ${dayInfo.day}: ${dayInfo.title}`
              : gameData?.title || "🎨 Stocking Color Match"}
          </h1>
          <p className="text-white/80 text-lg">
            {gameData?.description ||
              "Click on the stocking sections to color them!"}
          </p>
          
          {!showResults && (
            <div className="mt-4 inline-block p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-200 font-semibold">
                {hasPlayedToday ? '⚠️ Only First Attempt Counts!' : 'First Attempt Counts!'}
              </p>
              {hasPlayedToday && previousScore !== null ? (
                <div className="mt-2">
                  <p className="text-white/80 text-sm">
                    Your submitted score: <span className="font-bold text-yellow-300">{previousScore}%</span>
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    You can play again for fun, but your score won't change
                  </p>
                </div>
              ) : (
                <p className="text-white/80 text-sm mt-1">
                  Your first score will be submitted to the leaderboard
                </p>
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
                  Target Stocking
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
                  Your Stocking
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
                  🎨 Color Picker
                </h3>
                <ColorPickerNoEyedropper
                  value={colorPickerColor}
                  onChange={(color: string) => setColorPickerColor(color)}
                />

                {/* Current Color Preview */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-white text-sm font-medium">
                    Selected:
                  </div>
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
                  className="w-full bg-gradient-to-r from-red-500 to-green-500 text-white px-6 py-3 rounded-full font-semibold hover:from-red-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
                >
                  ✅ Done - Check My Colors!
                </button>
              </div>

              {/* Results Section */}
              {showResults && (
                <div className="border-t border-white/20 pt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Your Results
                  </h3>

                  {/* Overall Score */}
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-white mb-2">
                      {overallScore}%
                    </div>
                    <p className="text-white/80 text-sm">
                      {scoreSaved ? 'Submitted Score' : 'Overall Accuracy'}
                    </p>
                  </div>

                  {scoreSaved && (
                    <p className="text-green-300 text-center mb-4 text-sm">
                      ✅ Score saved to leaderboard!
                    </p>
                  )}
                  
                  {!scoreSaved && hasPlayedToday && previousScore !== null && (
                    <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-200 text-xs mb-1">
                        Practice Round - Score not saved
                      </p>
                      <p className="text-white/80 text-xs">
                        Your submitted score: <span className="font-bold text-yellow-300">{previousScore}%</span>
                      </p>
                    </div>
                  )}
                  
                  {scoreLoading && (
                    <p className="text-yellow-300 text-center mb-4 text-sm">
                      💾 Saving score...
                    </p>
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
                      {hasPlayedToday ? '🔄 Play Again (For Fun)' : '🔄 Try Again'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        {showResults && dayInfo && (
          <div className="mt-8 max-w-2xl mx-auto">
            <Leaderboard
              day={dayInfo.day}
              gameType="colorMatchGame"
              title={`Day ${dayInfo.day} Leaderboard`}
              showRank={true}
              maxEntries={10}
            />
          </div>
        )}
      </div>
    </div>
  );
}
