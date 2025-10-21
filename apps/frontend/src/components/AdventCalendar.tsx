import { useMemo, useEffect, useRef } from 'react'
import { animate } from 'animejs'

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

function DayCell({ day, isUnlocked, isToday, thumbnail, onDayClick }: DayCellProps) {
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // if (isUnlocked && cellRef.current) {
    //   animate({
    //     targets: cellRef.current,
    //     scale: [0.8, 1],
    //     opacity: [0, 1],
    //     duration: 600,
    //     delay: day * 50,
    //     easing: 'easeOutElastic(1, .8)'
    //   })
    // }
  }, [isUnlocked, day])

  const handleClick = () => {
    // if (isUnlocked && onDayClick) {
    //   animate({
    //     targets: cellRef.current,
    //     scale: [1, 0.95, 1],
    //     duration: 200,
    //     easing: 'easeInOutQuad'
    //   })
    //   onDayClick(day)
    // }
  }

  return (
    <div
      ref={cellRef}
      onClick={handleClick}
      className={
        `relative aspect-square rounded-xl border-2 transition-all duration-300 cursor-pointer` +
        ` ${isUnlocked ? 'bg-white/95 hover:-translate-y-2 shadow-xl hover:shadow-2xl' : 'bg-gray-200/70 cursor-not-allowed'} ` +
        ` ${isToday ? 'ring-4 ring-red-400 shadow-red-200' : ''}`
      }
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-400/20 rounded-full blur-2xl" />
      </div>

      <div className="absolute top-2 left-2 z-10">
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
          isUnlocked ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-400 text-white'
        }`}>
          {day}
        </span>
      </div>

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
          <span className="text-2xl animate-pulse">⭐</span>
        </div>
      )}

      {isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl" />
      )}
    </div>
  )
}

export default function AdventCalendar() {
  const today = new Date()
  const currentDay = today.getMonth() === 11 ? today.getDate() : 1 // December only; otherwise start at 1
  const containerRef = useRef<HTMLDivElement>(null)

  // Sample day data with thumbnails - you can replace these with your own images
  const dayData: DayData[] = useMemo(() => [
    { day: 1, thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=200&h=200&fit=crop&crop=center', title: 'Christmas Tree', description: 'The first day of advent!' },
    { day: 2, thumbnail: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=200&h=200&fit=crop&crop=center', title: 'Snowflakes', description: 'Beautiful winter crystals' },
    { day: 3, thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', title: 'Gingerbread', description: 'Sweet holiday treats' },
    { day: 4, thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center', title: 'Candles', description: 'Warm holiday glow' },
    { day: 5, thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop&crop=center', title: 'Ornaments', description: 'Shiny decorations' },
    { day: 6, thumbnail: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop&crop=center', title: 'Hot Chocolate', description: 'Warm winter drink' },
    { day: 7, thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', title: 'Cookies', description: 'Holiday baking' },
    { day: 8, thumbnail: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=200&h=200&fit=crop&crop=center', title: 'Winter Scene', description: 'Peaceful snow' },
    { day: 9, thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=200&h=200&fit=crop&crop=center', title: 'Presents', description: 'Gift giving' },
    { day: 10, thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center', title: 'Fireplace', description: 'Cozy warmth' },
    { day: 11, thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop&crop=center', title: 'Stockings', description: 'Hanging by the fire' },
    { day: 12, thumbnail: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop&crop=center', title: 'Winter Wonderland', description: 'Magical snow' },
    { day: 13, thumbnail: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=200&h=200&fit=crop&crop=center', title: 'Ice Skating', description: 'Winter fun' },
    { day: 14, thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=200&h=200&fit=crop&crop=center', title: 'Christmas Lights', description: 'Twinkling magic' },
    { day: 15, thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', title: 'Holiday Feast', description: 'Delicious food' },
    { day: 16, thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center', title: 'Warm Blanket', description: 'Cozy comfort' },
    { day: 17, thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop&crop=center', title: 'Holiday Music', description: 'Joyful sounds' },
    { day: 18, thumbnail: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop&crop=center', title: 'Winter Walk', description: 'Fresh air' },
    { day: 19, thumbnail: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=200&h=200&fit=crop&crop=center', title: 'Snow Angels', description: 'Childhood fun' },
    { day: 20, thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=200&h=200&fit=crop&crop=center', title: 'Family Time', description: 'Togetherness' },
    { day: 21, thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center', title: 'Holiday Cards', description: 'Season\'s greetings' },
    { day: 22, thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center', title: 'Winter Solstice', description: 'Longest night' },
    { day: 23, thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop&crop=center', title: 'Christmas Eve Eve', description: 'Almost here!' },
    { day: 24, thumbnail: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=200&h=200&fit=crop&crop=center', title: 'Christmas Eve', description: 'The magic begins!' }
  ], [])

  const days = useMemo(() => Array.from({ length: 24 }, (_, i) => i + 1), [])

  useEffect(() => {
    // if (containerRef.current) {
    //   anime({
    //     targets: containerRef.current,
    //     opacity: [0, 1],
    //     translateY: [50, 0],
    //     duration: 1000,
    //     easing: 'easeOutExpo'
    //   })
    // }
  }, [])

  const handleDayClick = (day: number) => {
    const dayInfo = dayData.find(d => d.day === day)
    if (dayInfo) {
      alert(`${dayInfo.title}\n\n${dayInfo.description}`)
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
          <p className="mt-3 text-red-100">
            Countdown to Christmas with daily surprises
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 md:p-8 shadow-xl border border-white/10">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-6">
            {days.map((day) => {
              const isUnlocked = day <= currentDay
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

          <div className="mt-8 text-center text-red-100">
            <p>
              {today.getMonth() === 11
                ? `Today is December ${currentDay}. ${currentDay < 24 ? 'Come back tomorrow for more!' : 'Merry Christmas! 🎅'}`
                : 'It is not December yet. The calendar unlocks in December!'}
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </div>
  )
}


