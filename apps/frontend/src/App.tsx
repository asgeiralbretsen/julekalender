import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import HealthMonitor from "./components/HealthMonitor";
import BlurGuessGame from "./components/BlurGuessGame";

function App() {
  return (
    <div className="min-h-screen">
      <Header />

      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="space-y-8">
          <HealthMonitor />
          <BlurGuessGame />
        </div>
      </SignedIn>
    </div>
  );
}

export default App;
