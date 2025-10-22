# Scoring System - First Attempt Only

## Overview

The scoring system allows users to play games multiple times per day, but **only the first score counts** toward the leaderboard. This encourages thoughtful first attempts while still allowing practice runs for fun.

## Key Features

### ✅ User Can:
- Play any game multiple times per day
- Practice and improve their skills
- See their submitted (first) score at all times
- View the leaderboard after each attempt

### 🚫 System Prevents:
- Score updates after first submission
- Confusion about which score counts
- Leaderboard manipulation through multiple attempts

## Implementation Details

### Backend (C#/.NET)

**File: `GameScoreService.cs`**

The backend only saves the first score:

```csharp
public async Task<GameScore> SaveGameScoreAsync(int userId, int day, string gameType, int score)
{
    var existingScore = await GetUserScoreForDayAsync(userId, day, gameType);
    
    // If score already exists, return it without updating
    if (existingScore != null)
    {
        return existingScore;
    }

    // Otherwise, save the new score
    var gameScore = new GameScore { /* ... */ };
    _context.GameScores.Add(gameScore);
    await _context.SaveChangesAsync();
    return gameScore;
}
```

### Frontend (React/TypeScript)

Both `BlurGuessGame.tsx` and `ColorMatchGame.tsx` implement:

1. **Before First Attempt:**
   - Show green banner: "🎯 First Attempt Counts!"
   - Clear message that the first score will be submitted
   - Regular "Start Game" button

2. **Before Subsequent Attempts:**
   - Show blue banner: "⚠️ Only First Attempt Counts!"
   - Display the submitted score prominently
   - Message: "You can play again for fun, but your score won't change"
   - Button changes to "Play Again (For Fun)"

3. **After First Attempt (Game Over):**
   - Show the current round score
   - Green checkmark: "✅ Score saved to leaderboard!"
   - Clear "Submitted Score" label

4. **After Subsequent Attempts (Game Over):**
   - Show the current round score labeled "This Round Score"
   - Blue box showing "Your Submitted Score (First Attempt)" with the original score
   - Message: "This is the score on the leaderboard"
   - Leaderboard displays with the first attempt score

## Visual Indicators

### Color Coding
- 🟢 **Green** = First attempt / Score will be saved
- 🔵 **Blue** = Subsequent attempt / Score won't be saved
- 🟡 **Yellow** = Submitted score highlight

### Icons
- 🎯 = First attempt message
- ⚠️ = Warning for subsequent attempts
- ✅ = Score successfully saved
- 🔄 = Play again button
- 💾 = Saving in progress

## User Experience Flow

### First Time Playing (Day 1)
1. User sees: "🎯 First Attempt Counts!"
2. User plays game
3. Score is saved: "✅ Score saved to leaderboard!"
4. Leaderboard shows their score
5. Button shows: "Play Again"

### Playing Again (Same Day)
1. User sees: "⚠️ Only First Attempt Counts!" + their submitted score
2. Button says: "Play Again (For Fun)"
3. User plays game
4. Game over shows:
   - Current round: 850
   - Submitted score: 1200 (highlighted in yellow)
   - "This is the score on the leaderboard"
5. Leaderboard still shows 1200

## Benefits

1. **Fairness**: Everyone gets one counted attempt per day
2. **Practice**: Users can improve without penalty
3. **Clarity**: Always clear which score counts
4. **Engagement**: Encourages return visits for practice
5. **Leaderboard Integrity**: Prevents score manipulation

## API Endpoints

- `POST /api/gamescore/save` - Saves score (only if first attempt)
- `GET /api/gamescore/leaderboard/day/{day}/game/{gameType}` - Retrieves leaderboard
- `GET /api/gamescore/user/{userId}/day/{day}/game/{gameType}/played` - Checks if user has played

## Game Types

Currently implemented in:
- `blurGuessGame` - Image blur guessing game
- `colorMatchGame` - Stocking color matching game

The system is generic and works with any game type.

