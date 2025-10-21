import { useMemo } from 'react'

interface DayCellProps {
  day: number
  isUnlocked: boolean
  isToday: boolean
}

function DayCell({ day, isUnlocked, isToday }: DayCellProps) {
  return (
    <div
      className={
        `relative aspect-square rounded-xl border transition transform` +
        ` ${isUnlocked ? 'bg-white/90 hover:-translate-y-1 shadow-lg' : 'bg-gray-200/70'} ` +
        ` ${isToday ? 'ring-4 ring-red-400' : ''}`
      }
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
      </div>

      <div className="absolute top-2 left-2">
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded ${
          isUnlocked ? 'bg-red-600 text-white' : 'bg-gray-400 text-white'
        }`}>
          {day}
        </span>
      </div>

      <div className="h-full w-full flex items-center justify-center">
        {isUnlocked ? (
          <span className="text-3xl select-none">🎁</span>
        ) : (
          <span className="text-2xl select-none text-gray-400">🔒</span>
        )}
      </div>

      {isToday && (
        <div className="absolute -top-3 -right-3">
          <span className="text-2xl">⭐</span>
        </div>
      )}
    </div>
  )
}

export default function AdventCalendar() {
  const today = new Date()
  const currentDay = today.getMonth() === 11 ? today.getDate() : 1 // December only; otherwise start at 1

  const days = useMemo(() => Array.from({ length: 24 }, (_, i) => i + 1), [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900">
      <div className="relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow">
            🎄 Advent Calendar
          </h1>
          <p className="mt-3 text-emerald-100">
            Countdown to Christmas with daily surprises
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 md:p-8 shadow-xl border border-white/10">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-6">
            {days.map((day) => {
              const isUnlocked = day <= currentDay
              const isToday = day === currentDay && today.getMonth() === 11
              return (
                <DayCell key={day} day={day} isUnlocked={isUnlocked} isToday={isToday} />
              )
            })}
          </div>

          <div className="mt-8 text-center text-emerald-100">
            <p>
              {today.getMonth() === 11
                ? `Today is December ${currentDay}. ${currentDay < 24 ? 'Come back tomorrow for more!' : 'Merry Christmas! 🎅'}`
                : 'It is not December yet. The calendar unlocks in December!'}
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-900 to-transparent" />
    </div>
  )
}


