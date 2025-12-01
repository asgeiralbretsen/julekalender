import Stocking from "./Stocking";
import { useEffect, useState } from "react";
import { ChristmasBackground } from "../ChristmasBackground";
import chroma from "chroma-js";
import { shuffleArray } from "../../utils";
import { GameProgress } from "./GameProgress";

interface Colors {
  topColor: string;
  topStripesColor: string;
  mainColor: string;
  heelColor: string;
  stripesColor: string;
}

const uncoloredSockColors: Colors = {
  topColor: "gray",
  topStripesColor: "white",
  mainColor: "gray",
  heelColor: "white",
  stripesColor: "white",
};

const GAME_TIME_LIMIT = 60; // seconds

export function ColorMatchGame() {
  const [loading, setLoading] = useState(true);

  /**
   * The color of the sock that the player needs to copy
   */
  const [originalColors, setOriginalColors] =
    useState<Colors>(uncoloredSockColors);
  /**
   * The colors of the stocking that the player puts colors onto
   */
  const [currentColors, setCurrentColors] =
    useState<Colors>(uncoloredSockColors);

  /**
   * An array of each stocking's colors
   */
  const [allColors, setAllColors] = useState<Colors[]>();

  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );

  /**
   * Array of available colors to select from
   */
  const [colorSelection, setColorSelection] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");

  /**
   * Ticks down once for the whole game, is not reset for each stocking
   */
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME_LIMIT);
  const [round, setRound] = useState<number>(0);
  /**
   * One point is awarded per correctly colored sock
   */
  const [score, setScore] = useState<number>(0);

  const [correctColors, setCorrectColors] = useState<boolean[]>();

  /**
   * Values retrieved from Sanity
   */
  const [gameDescription, setGameDescription] = useState<string>("");
  const [gameTitle, setGameTitle] = useState<string>("Color Match Game");

  /**
   * Load game data from Sanity
   */
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

            // Now stockingColors is an array of socks
            const stockingsArray = data.stockings || [];

            setAllColors(stockingsArray);

            const firstSock = stockingsArray[0] || {};
            const stockingColors: Colors = {
              topColor: firstSock.topColor || "#ff0000",
              topStripesColor: firstSock.topStripesColor || "#800080",
              mainColor: firstSock.mainColor || "#008000",
              heelColor: firstSock.heelColor || "#ffff00",
              stripesColor: firstSock.stripesColor || "#800080",
            };

            setOriginalColors(stockingColors);

            setGameTitle(parsedData.title || "Color Match Game");
            setGameDescription(
              parsedData.description || "Match the colors of the sock!"
            );

            createColorSelection();
            checkIsCorrect();
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

  // Game loop
  useEffect(() => {
    if (timeLeft <= 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const nextRound = () => {
    setRound((prevRound) => prevRound + 1);
  };

  const setSingleColor = (section: keyof Colors, color: string) => {
    setCurrentColors((prev) => ({
      ...prev,
      [section]: color,
    }));
  };
  interface ColorShiftOptions {
    hueShift?: number; // in degrees, ±value
    saturationShift?: number; // fraction, ±value (0–1)
    lightnessShift?: number; // fraction, ±value (0–1)
  }

  function generateSimilarColor(
    baseColor: string,
    options: ColorShiftOptions = {}
  ): string {
    const { hueShift = 0, saturationShift = 0, lightnessShift = 0 } = options;

    const hsl = chroma(baseColor).hsl();

    const h = (hsl[0] + (Math.random() * 2 * hueShift - hueShift) + 360) % 360;
    const s = Math.min(
      1,
      Math.max(
        0,
        hsl[1] + (Math.random() * 2 * saturationShift - saturationShift)
      )
    );
    const l = Math.min(
      1,
      Math.max(
        0,
        hsl[2] + (Math.random() * 2 * lightnessShift - lightnessShift)
      )
    );

    return chroma.hsl(h, s, l).hex();
  }

  const createColorSelection = () => {
    const colors: string[] = [];
    Object.values(originalColors).forEach((color: string) => {
      for (let i = 0; i < Math.max(6, round); i++) {
        colors.push(
          generateSimilarColor(color, {
            hueShift: (i / 4) * 10,
            saturationShift: (i / 4) * 0.1,
            lightnessShift: (i / 4) * 0.1,
          })
        );
      }
    });

    setColorSelection(shuffleArray(colors));
  };

  const checkIsCorrect = () => {
    const corrects = [];
    Object.entries(currentColors).forEach(([key, value]) => {
      corrects.push(value === originalColors[key]);
    });

    setCorrectColors(corrects);
  };

  useEffect(() => {
    checkIsCorrect();
  }, [currentColors]);

  return (
    <ChristmasBackground>
      <div className="h-screen w-screen flex flex-col items-center justify-center">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className=" flex flex-row items-center justify-center">
            {allColors.map((sockColors, index) => (
              <Stocking
                topColor={sockColors.topColor}
                topStripesColor={sockColors.topStripesColor}
                mainColor={sockColors.mainColor}
                heelColor={sockColors.heelColor}
                stripesColor={sockColors.stripesColor}
                key={index}
              />
            ))}

            <div className="flex flex-wrap max-w-[150px] gap-2 justify-center">
              {colorSelection.map((color, index) => (
                <button
                  role="button"
                  onClick={() => {
                    setSelectedColor(color);
                  }}
                  key={color + index}
                  className={`h-10 w-10 rounded-full ${selectedColor === color ? "border-4 border-solid" : ""}`}
                  style={{
                    backgroundColor: color,
                  }}
                ></button>
              ))}
            </div>
            <div className="flex flex-col justify-center items-center">
              <Stocking
                topColor={currentColors.topColor}
                topStripesColor={currentColors.topStripesColor}
                mainColor={currentColors.mainColor}
                heelColor={currentColors.heelColor}
                stripesColor={currentColors.stripesColor}
                onClickTopColor={() => {
                  setSingleColor("topColor", selectedColor);
                }}
                onClickTopStripesColor={() => {
                  setSingleColor("topStripesColor", selectedColor);
                }}
                onClickMainColor={() => {
                  setSingleColor("mainColor", selectedColor);
                }}
                onClickHeelColor={() => {
                  setSingleColor("heelColor", selectedColor);
                }}
                onClickStripesColor={() => {
                  setSingleColor("stripesColor", selectedColor);
                }}
              />
              <GameProgress segments={correctColors} />
            </div>
          </div>
        )}
      </div>
    </ChristmasBackground>
  );
}
