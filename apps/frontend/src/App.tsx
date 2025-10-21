import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import AdventCalendar from './components/AdventCalendar'
import { useUserSync } from './hooks/useUserSync'
import { svgCursorUrl } from "./components/cursor"; 
import { useEffect, useMemo } from 'react'

function App() {
  // This will automatically sync users when they log in
  useUserSync();

  const cursor = useMemo(
    () =>
      svgCursorUrl({
        primary: "#ED5564",
        secondary: "#E6E9ED",
        size: 40,
      }),
    []
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--app-cursor", cursor);
  }, [cursor]);

  return (
    <div className="min-h-screen">
      <Header />
      
      <SignedOut>
        <LandingPage />
      </SignedOut>
      
      <SignedIn>
        <AdventCalendar />
      </SignedIn>
    </div>
  )
}

export default App
