import { animate } from 'animejs'
import { useEffect, useRef, useState } from 'react'

interface DayCellProps {
    day: number
    isUnlocked: boolean
    isToday: boolean
    thumbnail?: string
    onDayClick?: (day: number) => void
  }

export default function DoorCell({ day, isUnlocked, isToday, thumbnail, onDayClick }: DayCellProps) {
    const cellRef = useRef<HTMLDivElement>(null);
    const doorWrapRef = useRef<HTMLDivElement>(null); // NEW
    const [isOpen, setIsOpen] = useState(false);
  
    useEffect(() => {
      if (cellRef.current) {
        animate(cellRef.current, {
          scale: [0, 1],
          opacity: [0, 1],
          rotate: [180, 0],
          duration: 800,
          delay: day * 80,
          easing: 'easeOutElastic(1, .6)'
        });
      }
    }, [day]);
  
    const handleClick = () => {
      if (isUnlocked && onDayClick && doorWrapRef.current) {
        setIsOpen(true);
        // Rotate the WRAPPER, not the front panel
        animate(doorWrapRef.current, {
          rotateY: [0, -180],
          duration: 800,
          easing: 'easeInOutQuad',
          complete: () => onDayClick(day),
        });
      }
    };
  
    const handleMouseEnter = () => {
      if (isUnlocked && cellRef.current && !isOpen) {
        animate(cellRef.current, { scale: 1.05, translateY: -8, duration: 300, easing: 'easeOutQuad' });
      }
    };
  
    const handleMouseLeave = () => {
      if (isUnlocked && cellRef.current && !isOpen) {
        animate(cellRef.current, { scale: 1, translateY: 0, duration: 300, easing: 'easeOutQuad' });
      }
    };
  
    return (
      <div
        ref={cellRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative aspect-square ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        style={{ perspective: '1000px' }}
      >
        {/* Flip wrapper holds both faces */}
        <div
          ref={doorWrapRef}
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',     // nice door hinge feel
            willChange: 'transform',
          }}
        >
          {/* Door front */}
          <div
            className={`absolute inset-0 rounded-2xl shadow-2xl transition-all duration-300 ${
              isUnlocked 
                ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-800' 
                : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600'
            }`}
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Ornamental border */}
            <div className="absolute inset-2 rounded-xl border-4 border-yellow-400/30">
              <div className="absolute inset-2 rounded-lg border-2 border-yellow-300/20" />
            </div>
  
            {/* Snow effect on top */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl" />
            
            {/* Snowflake decorations */}
            <div className="absolute top-3 left-3 text-white/30 text-xl">❄</div>
            <div className="absolute top-3 right-3 text-white/30 text-xl">❄</div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-xl">❄</div>
  
            {/* Day number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`text-5xl font-bold ${isUnlocked ? 'text-yellow-300' : 'text-gray-300'} drop-shadow-lg`}
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
              >
                {day}
              </div>
            </div>
  
            {/* Door handle */}
            {isUnlocked && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-8 bg-yellow-500 rounded-full shadow-lg" />
            )}
  
            {/* Lock icon for locked days */}
            {!isUnlocked && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <span className="text-3xl drop-shadow-lg">🔒</span>
              </div>
            )}
  
            {/* Today badge */}
            {isToday && (
              <>
                <div className="absolute -top-2 -right-2 animate-pulse">
                  <div className="bg-yellow-400 text-red-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">
                    TODAY
                  </div>
                </div>
                <div className="absolute -top-4 -left-4 animate-bounce">
                  <span className="text-4xl drop-shadow-xl">⭐</span>
                </div>
              </>
            )}
  
            {/* Sparkles */}
            {isUnlocked && isToday && (
              <>
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0s' }} />
                <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>
  
          {/* Door back (revealed content) */}
          <div
            className="absolute inset-0 rounded-2xl shadow-2xl bg-gradient-to-br from-green-600 via-green-700 to-green-800"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',   // pre-rotated so it faces viewer after wrapper flips
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {thumbnail ? (
                <img 
                  src={thumbnail} 
                  alt={`Day ${day}`}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : (
                <span className="text-6xl drop-shadow-xl">🎁</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }