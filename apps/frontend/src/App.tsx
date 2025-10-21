import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import AdventCalendar from './components/AdventCalendar'
import { useUserSync } from './hooks/useUserSync'

function App() {
  // This will automatically sync users when they log in
  useUserSync();

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
