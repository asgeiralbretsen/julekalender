import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import logoIcon from '../assets/unimicro-logoikon-hvit_RGB.png';

export default function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 shadow-christmas-lg border-b-2 border-yellow-400/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-5 bg-cover bg-center" />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-10 text-white/20 text-xl animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          ❄
        </div>
        <div className="absolute top-3 right-20 text-white/20 text-lg animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          ❄
        </div>
        <div className="absolute top-2 left-1/3 text-white/20 text-base animate-pulse" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
          ❄
        </div>
        <div className="absolute top-3 right-1/4 text-white/20 text-xl animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}>
          ❄
        </div>
        <div className="absolute top-2 left-1/2 text-white/20 text-lg animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
          ❄
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-xl font-bold text-red-100 hover:text-red-200 transition-all duration-300 drop-shadow-lg flex items-center space-x-2 hover:scale-105"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
            >
              <img 
                src={logoIcon}
                alt="Logo" 
                className="w-8 h-8 object-contain drop-shadow-md"
              />
              <span>Julekalender</span>
            </Link>
            
            <SignedIn>
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/calendar" 
                  className={`text-sm font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
                    isActive('/calendar') 
                      ? 'text-yellow-300 bg-white/10 backdrop-blur-sm shadow-md' 
                      : 'text-white hover:text-yellow-300 hover:bg-white/5'
                  }`}
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  Kalender
                </Link>
                <Link 
                  to="/leaderboard" 
                  className={`text-sm font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
                    isActive('/leaderboard') 
                      ? 'text-yellow-300 bg-white/10 backdrop-blur-sm shadow-md' 
                      : 'text-white hover:text-yellow-300 hover:bg-white/5'
                  }`}
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  Toppliste
                </Link>
              </nav>
            </SignedIn>
          </div>
          
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-green-500">
                  Logg inn
                </button>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>

            <SignedIn>
              <button
                onClick={toggleMobileMenu}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:text-yellow-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-400"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </SignedIn>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-red-800/50 backdrop-blur-sm border-t border-yellow-400/20 rounded-b-lg">
              <Link
                to="/calendar"
                className={`block px-3 py-2 rounded-md text-base font-semibold ${
                  isActive('/calendar')
                    ? 'text-yellow-300 bg-white/10'
                    : 'text-white hover:text-yellow-300 hover:bg-white/5'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📅 Kalender
              </Link>
              <Link
                to="/leaderboard"
                className={`block px-3 py-2 rounded-md text-base font-semibold ${
                  isActive('/leaderboard')
                    ? 'text-yellow-300 bg-white/10'
                    : 'text-white hover:text-yellow-300 hover:bg-white/5'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏆 Toppliste
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
