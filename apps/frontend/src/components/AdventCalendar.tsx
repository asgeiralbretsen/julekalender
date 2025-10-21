import { useMemo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { client } from '../lib/sanity'
import { animate } from 'animejs'
import { Timer } from './Timer'

interface DayCellProps {
  day: number
  isUnlocked: boolean
  isToday: boolean
  thumbnail?: string
  onDayClick?: (day: number) => void
}

interface DayData {
  day: number
  thumbnail?: string
  title?: string
  description?: string
}

interface SanityDay {
  _id: string
  dayNumber: number
  date: string
  title: string
  image?: {
    asset: {
      _ref: string
    }
    alt?: string
  }
  gameType?: 'none' | 'blurGuessGame'
  blurGuessGameData?: {
    images: Array<{
      image: {
        asset: {
          _ref: string
        }
      }
      answer: string
    }>
  }
  isUnlocked: boolean
}

function DayCell({ day, isUnlocked, isToday, thumbnail, onDayClick }: DayCellProps) {
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isUnlocked && cellRef.current) {
      animate(cellRef.current, {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 600,
        delay: day * 50,
        easing: 'easeOutElastic(1, .8)'
      })
    }
  }, [isUnlocked, day])

  const handleClick = () => {
    if (isUnlocked && onDayClick && cellRef.current) {
      animate(cellRef.current, {
        scale: [1, 0.95, 1],
        duration: 200,
        easing: 'easeInOutQuad'
      })
      onDayClick(day)
    }
  }

  return (
    <div
      ref={cellRef}
      onClick={handleClick}
      className={
        `relative aspect-square rounded-xl border-2 transition-all duration-300 cursor-pointer` +
        ` ${isUnlocked ? 'bg-white/95 hover:-translate-y-2 shadow-xl hover:shadow-2xl' : 'bg-gray-200/70 cursor-not-allowed'} ` +
        ` ${isToday ? 'ring-4 ring-yellow-400 shadow-yellow-200 bg-gradient-to-br from-yellow-50 to-red-50' : ''}`
      }
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-400/20 rounded-full blur-2xl" />
      </div>

      <div className="absolute top-2 left-2 z-10">
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
          isUnlocked ? (isToday ? 'bg-yellow-500 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg') : 'bg-gray-400 text-white'
        }`}>
          {day}
        </span>
      </div>
      
      {isToday && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-yellow-500 text-white shadow-lg">
            TODAY
          </span>
        </div>
      )}

      <div className="h-full w-full flex items-center justify-center relative z-10">
        {isUnlocked ? (
          thumbnail ? (
            <img 
              src={thumbnail} 
              alt={`Day ${day}`}
              className="w-12 h-12 object-cover rounded-lg shadow-md"
            />
          ) : (
            <span className="text-3xl select-none">🎁</span>
          )
        ) : (
          <span className="text-2xl select-none text-gray-400">🔒</span>
        )}
      </div>

      {isToday && (
        <div className="absolute -top-3 -right-3 z-10">
          <span className="text-3xl animate-bounce">🌟</span>
        </div>
      )}

      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl" />
      )}
    </div>
  )
}

export default function AdventCalendar() {
  const navigate = useNavigate()
  const today = new Date()
  const currentDay = today.getMonth() === 11 ? today.getDate() : 1 // December only; otherwise start at 1
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [sanityDays, setSanityDays] = useState<SanityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch days from Sanity
  useEffect(() => {
    const fetchDays = async () => {
      try {
        const query = `*[_type == "day"] | order(dayNumber asc) {
          _id,
          dayNumber,
          date,
          title,
          image,
          gameType,
          blurGuessGameData,
          isUnlocked
        }`
        const data = await client.fetch(query)
        setSanityDays(data)
      } catch (err) {
        setError('Failed to fetch advent days')
        console.error('Error fetching days:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDays()
  }, [])

  // Convert Sanity days to the format expected by the component
  const dayData: DayData[] = useMemo(() => {
    // Only use Sanity data - no fallbacks
    return sanityDays.map(sanityDay => ({
      day: sanityDay.dayNumber,
      thumbnail: sanityDay.image ? `https://cdn.sanity.io/images/54fixmwv/production/${sanityDay.image.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}` : undefined,
      title: sanityDay.title,
      description: `Day ${sanityDay.dayNumber} of advent!`
    }))
  }, [sanityDays])

  // Only show days that exist in Sanity, removing duplicates
  const days = useMemo(() => {
    const dayNumbers = sanityDays.map(day => day.dayNumber)
    const uniqueDays = [...new Set(dayNumbers)].sort((a, b) => a - b)
    return uniqueDays
  }, [sanityDays])

  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1000,
        easing: 'easeOutExpo'
      })
    }
  }, [])

  const handleDayClick = (day: number) => {
    const dayInfo = dayData.find(d => d.day === day)
    const sanityDay = sanityDays.find(d => d.dayNumber === day)
    
    // Debug logging
    console.log('Day clicked:', day)
    console.log('Sanity day data:', sanityDay)
    console.log('Game type:', sanityDay?.gameType)
    console.log('Game data:', sanityDay?.blurGuessGameData)
    
    // Check if this day has a game and navigate to it
    if (sanityDay?.gameType && sanityDay.gameType !== 'none') {
      console.log('Game type found:', sanityDay.gameType)
      
      // Store game data in sessionStorage for the game component to access
      if (sanityDay.gameType === 'blurGuessGame' && sanityDay.blurGuessGameData) {
        console.log('Navigating to BlurGuessGame with data:', sanityDay.blurGuessGameData)
        
        sessionStorage.setItem('currentGameData', JSON.stringify({
          blurGuessGame: sanityDay.blurGuessGameData
        }))
        sessionStorage.setItem('currentGameType', sanityDay.gameType)
        sessionStorage.setItem('currentDayInfo', JSON.stringify({
          day: sanityDay.dayNumber,
          title: sanityDay.title
        }))
        
        // Navigate to the appropriate game route
        navigate('/game/blurGuessGame')
        return
      } else {
        console.log('Game type is blurGuessGame but no game data found')
      }
    } else {
      console.log('No game type or game type is none')
    }
    
    // Fallback to showing alert for days without games
    if (dayInfo) {
      let message = `${dayInfo.title}\n\n${dayInfo.description}`
      alert(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900">
      <div className="relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
      </div>

      <div ref={containerRef} className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow">
            🎄 Advent Calendar
          </h1>
          <Timer mode="up" durationMs={10000} startFromMs={1000} running={true} isFinished={false} onFinished={() => {console.log('finished')}} className="text-red-100" />
          <p className="mt-3 text-red-100">
            Countdown to Christmas with daily surprises
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-2 text-red-100">Loading advent days...</span>
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-200 bg-red-800/20 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">Please check your Sanity configuration</p>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 md:p-8 shadow-xl border border-white/10">
          {!loading && !error && sanityDays.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Advent Days Found</h3>
              <p className="text-red-100 mb-4">
                Create your first advent day in Sanity Studio to get started!
              </p>
              <a 
                href="/studio/" 
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Sanity Studio
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {days.map((day) => {
                const isUnlocked = true // All days are always unlocked/visible
                const isToday = day === currentDay && today.getMonth() === 11
                const dayInfo = dayData.find(d => d.day === day)
                return (
                  <DayCell 
                    key={day} 
                    day={day} 
                    isUnlocked={isUnlocked} 
                    isToday={isToday}
                    thumbnail={dayInfo?.thumbnail}
                    onDayClick={handleDayClick}
                  />
                )
              })}
            </div>
          )}

          {sanityDays.length > 0 && (
            <div className="mt-8 text-center text-red-100">
              <p>
                {today.getMonth() === 11
                  ? `Today is December ${currentDay}. All advent days are visible! 🎄`
                  : 'All advent days are visible! The calendar is always open! 🎄'}
              </p>
              <p className="text-sm mt-2 text-red-200">
                Showing {sanityDays.length} advent day{sanityDays.length !== 1 ? 's' : ''} from Sanity
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </div>
  )
}


