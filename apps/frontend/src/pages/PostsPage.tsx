import Posts from '../components/Posts'

export default function PostsPage() {
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
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-300 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            📰 Posts
          </h1>
          <p className="mt-3 text-red-100">
            Read the latest updates and news
          </p>
        </div>
        
        <Posts />
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </div>
  )
}
