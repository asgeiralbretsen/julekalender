import { useState, useEffect, useRef } from 'react'
import { animate } from 'animejs'

interface AnimatedTimerProps {
  initialTime?: number // in seconds
  direction?: 'up' | 'down'
  onFinish?: () => void
  onTimeUpdate?: (time: number) => void
  autoStart?: boolean
  className?: string
  showMilliseconds?: boolean
  //duration?: number // animation duration in ms
}

export default function AnimatedTimer({
  initialTime = 0,
  direction = 'up',
  onFinish,
  onTimeUpdate,
  autoStart = false,
  className = '',
  showMilliseconds = false,
  //duration = 1000
}: AnimatedTimerProps) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isFinished, setIsFinished] = useState(false)
  const [displayTime, setDisplayTime] = useState(initialTime)
  
  const timerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<unknown>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Format time as MM:SS or MM:SS.mmm
  const formatTime = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    const milliseconds = Math.floor((seconds % 1) * 1000)

    const formattedMinutes = minutes.toString().padStart(2, '0')
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0')
    const formattedMilliseconds = milliseconds.toString().padStart(3, '0')

    if (showMilliseconds) {
      return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`
    }
    return `${formattedMinutes}:${formattedSeconds}`
  }

  // Animate the number change
  const animateTimeChange = (fromTime: number, toTime: number) => {
    if (animationRef.current && typeof (animationRef.current as any).pause === 'function') {
      (animationRef.current as any).pause()
    }

    animationRef.current = animate(
      { value: fromTime },
      {
        value: toTime,
        duration: 200, // Quick animation for smooth updates
        easing: 'easeOutQuad',
        update: (anim: unknown) => {
          setDisplayTime((anim as animate).animatables[0].target.value)
        }
      }
    )
  }

  // Start the timer
  const start = () => {
    if (isFinished) return
    
    setIsRunning(true)
    startTimeRef.current = Date.now() - pausedTimeRef.current
  }

  // Pause the timer
  const pause = () => {
    setIsRunning(false)
    pausedTimeRef.current = Date.now() - startTimeRef.current
  }

  // Stop and reset the timer
  const stop = () => {
    setIsRunning(false)
    setIsFinished(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (animationRef.current) {
      animationRef.current.pause()
    }
    if (onFinish) {
      onFinish()
    }
  }

  // Reset the timer to initial state
  const reset = () => {
    setIsRunning(false)
    setIsFinished(false)
    setTime(initialTime)
    setDisplayTime(initialTime)
    pausedTimeRef.current = 0
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (animationRef.current) {
      animationRef.current.pause()
    }
  }

  // Update timer every 10ms for smooth display
  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        
        if (direction === 'up') {
          const newTime = initialTime + elapsed
          setTime(newTime)
          animateTimeChange(time, newTime)
          if (onTimeUpdate) {
            onTimeUpdate(newTime)
          }
        } else {
          const newTime = Math.max(0, initialTime - elapsed)
          setTime(newTime)
          animateTimeChange(time, newTime)
          if (onTimeUpdate) {
            onTimeUpdate(newTime)
          }
          
          // Check if countdown reached zero
          if (newTime <= 0) {
            stop()
          }
        }
      }, 10)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isFinished, direction, initialTime, onTimeUpdate, time])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isRunning && !isFinished) {
      start()
    }
  }, [autoStart])

  // Animate the timer display on mount
  useEffect(() => {
    if (timerRef.current) {
      animate(timerRef.current, {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutElastic(1, .8)'
      })
    }
  }, [])

  const getStatusColor = () => {
    if (isFinished) return 'text-green-500'
    if (isRunning) return 'text-blue-500'
    return 'text-gray-500'
  }

  const getStatusText = () => {
    if (isFinished) return 'Finished!'
    if (isRunning) return 'Running'
    return 'Stopped'
  }

  return (
    <div className={`animated-timer-component ${className}`}>
      <div className="text-center">
        <div 
          ref={timerRef}
          className={`text-4xl font-mono font-bold ${getStatusColor()} mb-2 transition-all duration-300`}
        >
          {formatTime(displayTime)}
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          {getStatusText()}
        </div>

        <div className="flex justify-center space-x-2">
          {!isRunning && !isFinished && (
            <button
              onClick={start}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors transform hover:scale-105"
            >
              Start
            </button>
          )}
          
          {isRunning && (
            <button
              onClick={pause}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors transform hover:scale-105"
            >
              Pause
            </button>
          )}
          
          {!isRunning && !isFinished && (
            <button
              onClick={start}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors transform hover:scale-105"
            >
              Resume
            </button>
          )}
          
          <button
            onClick={stop}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isFinished}
          >
            Stop
          </button>
          
          <button
            onClick={reset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors transform hover:scale-105"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
