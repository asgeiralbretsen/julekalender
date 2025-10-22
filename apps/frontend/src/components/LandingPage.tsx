import { SignInButton } from '@clerk/clerk-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-white/20 text-2xl animate-pulse" style={{ animationDelay: '0s' }}>
          ❄
        </div>
        <div className="absolute top-40 right-20 text-white/20 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>
          ❄
        </div>
        <div className="absolute top-60 left-1/3 text-white/20 text-xl animate-pulse" style={{ animationDelay: '2s' }}>
          ❄
        </div>
        <div className="absolute top-80 right-1/4 text-white/20 text-2xl animate-pulse" style={{ animationDelay: '1.5s' }}>
          ❄
        </div>
        <div className="absolute bottom-40 left-1/4 text-white/20 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>
          ❄
        </div>
        <div className="absolute bottom-60 right-1/3 text-white/20 text-xl animate-pulse" style={{ animationDelay: '2.5s' }}>
          ❄
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-3xl p-12 shadow-christmas-lg border-2 border-yellow-400/30 max-w-2xl">
          <div className="mb-6 text-6xl">🎄</div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-yellow-300 mb-4 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Julekalender
          </h1>
          <p className="text-xl text-white mb-8 drop-shadow">
            Tell ned til jul med daglige overraskelser! 🎁
          </p>
          
          <SignInButton mode="modal">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-green-500">
              🎅 Logg inn for å starte
            </button>
          </SignInButton>
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </div>
  );
}
