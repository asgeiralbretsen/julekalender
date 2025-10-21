import { SignInButton } from '@clerk/clerk-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Julekalender
        </h1>
        
        <SignInButton mode="modal">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
