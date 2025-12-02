import { ChristmasBackground } from "./ChristmasBackground";

export function NoDataScreen() {
  return (
    <ChristmasBackground>
      <div className="flex items-center justify-center min-h-[calc(100vh-130px)] text-center">
        <p className="text-red-100">Ingen data tilgjengelig</p>
      </div>
    </ChristmasBackground>
  );
}
