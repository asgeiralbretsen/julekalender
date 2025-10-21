import { useEffect, useState } from 'react'
import { client } from '../lib/sanity'

interface Day {
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
  game?: {
    title: string
    description?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    estimatedTime?: string
  }
  isUnlocked: boolean
}

const DAYS_QUERY = `*[_type == "day"] | order(dayNumber asc) {
  _id,
  dayNumber,
  date,
  title,
  image,
  game,
  isUnlocked
}`

export default function Days() {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDays = async () => {
      try {
        const data = await client.fetch(DAYS_QUERY)
        setDays(data)
      } catch (err) {
        setError('Failed to fetch advent days')
        console.error('Error fetching days:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDays()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Advent Calendar</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Advent Calendar</h2>
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  const currentDate = new Date()
  const currentDay = currentDate.getDate()
  const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Advent Calendar</h2>
      {days.length === 0 ? (
        <p className="text-gray-500">No advent days available</p>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const isToday = day.dayNumber === currentDay && currentMonth === 12
            const isPast = day.dayNumber < currentDay && currentMonth === 12
            const canUnlock = day.dayNumber <= currentDay && currentMonth === 12
            
            return (
              <div 
                key={day._id} 
                className={`border rounded-lg p-3 ${
                  isToday 
                    ? 'border-blue-500 bg-blue-50' 
                    : isPast 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isToday 
                        ? 'bg-blue-500 text-white' 
                        : isPast 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {day.dayNumber}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{day.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(day.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {day.game && (
                      <div className="text-sm">
                        <span className="text-gray-600">Game: </span>
                        <span className="font-medium">{day.game.title}</span>
                        {day.game.difficulty && (
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            day.game.difficulty === 'easy' 
                              ? 'bg-green-100 text-green-800'
                              : day.game.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {day.game.difficulty}
                          </span>
                        )}
                      </div>
                    )}
                    {!canUnlock && (
                      <span className="text-xs text-gray-400">🔒 Locked</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
