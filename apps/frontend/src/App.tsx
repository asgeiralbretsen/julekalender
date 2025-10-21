import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import HealthMonitor from './components/HealthMonitor'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <SignedOut>
        <LandingPage />
      </SignedOut>
      
      <SignedIn>
        <HealthMonitor />
      </SignedIn>
    </div>
  )
}

export default App
