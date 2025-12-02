import { ChristmasBackground } from "./ChristmasBackground";

export interface StartGameScreenProps {
  title: string;
  description: string;
  // bullet points
  howToPlay?: string[];
  previousScore?: number;
  onClickStartGame: () => void;
}

export function StartGameScreen({
  title,
  description,
  howToPlay,
  previousScore,
  onClickStartGame,
}: StartGameScreenProps) {
  return (
    <ChristmasBackground>
      <div className="min-h-[calc(100vh-130px)] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
          <p className="text-white/80 mb-6">{description}</p>

          {previousScore !== null && previousScore !== undefined && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-400/50 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Bare første forsøk teller!
              </p>
              <p className="text-white/70 text-xs mt-1">
                Din innsendte poengsum: {previousScore} poeng
              </p>
            </div>
          )}

          {howToPlay && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl text-left">
              <h3 className="text-white font-semibold mb-2">Hvordan spille:</h3>
              <ul className="text-white/70 text-sm space-y-1">
                {howToPlay.map((point) => (
                  <li>{point}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onClickStartGame}
            className="w-full bg-green-700 text-white px-8 py-4 rounded-full font-bold text-xl hover:from-red-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
          >
            Start Spill
          </button>
        </div>
      </div>
    </ChristmasBackground>
  );
}
