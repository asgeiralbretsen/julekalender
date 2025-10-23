import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from '../components/LandingPage'
import AdventCalendar from '../components/AdventCalendar'

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      
      <SignedIn>
        <AdventCalendar />
      </SignedIn>
    </>
  )
}
