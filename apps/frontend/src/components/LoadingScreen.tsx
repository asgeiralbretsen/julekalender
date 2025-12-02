import { ChristmasBackground } from "./ChristmasBackground";

export function LoadingScreen() {
  return (
    <ChristmasBackground>
      <div className="flex items-center justify-center min-h-[calc(100vh-130px)] text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300 mb-4"></div>
          <p className="text-red-100">Laster...</p>
        </div>
      </div>
    </ChristmasBackground>
  );
}
