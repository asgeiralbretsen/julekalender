# Leaderboard Component

A generic, reusable leaderboard component for displaying game scores across different game types.

## Features

- 🏆 Displays top players with medal icons (🥇 🥈 🥉) for top 3
- 👤 Highlights current user's position
- 📊 Shows player rank, name, score, and play time
- 🎨 Beautiful gradient design with blur effects
- ⚡ Real-time loading and error states
- 📱 Responsive design

## Usage

```tsx
import Leaderboard from './Leaderboard';

function MyGame() {
  return (
    <Leaderboard
      day={1}
      gameType="blurGuessGame"
      title="Day 1 Leaderboard"
      showRank={true}
      maxEntries={10}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `day` | `number` | Yes | - | The day number for the game |
| `gameType` | `string` | Yes | - | The type of game (e.g., 'blurGuessGame', 'colorMatchGame') |
| `title` | `string` | No | `'Leaderboard'` | The title displayed at the top of the leaderboard |
| `showRank` | `boolean` | No | `true` | Whether to show rank numbers/medals |
| `maxEntries` | `number` | No | `undefined` | Maximum number of entries to display (unlimited if not set) |

## Integration Examples

### BlurGuessGame

```tsx
{gameState.gameEnded && dayInfo && (
  <Leaderboard
    day={dayInfo.day}
    gameType="blurGuessGame"
    title={`Day ${dayInfo.day} Leaderboard`}
    showRank={true}
    maxEntries={10}
  />
)}
```

### ColorMatchGame

```tsx
{showResults && dayInfo && (
  <Leaderboard
    day={dayInfo.day}
    gameType="colorMatchGame"
    title={`Day ${dayInfo.day} Leaderboard`}
    showRank={true}
    maxEntries={10}
  />
)}
```

## Backend Requirements

The leaderboard requires the following backend endpoint:

```
GET /api/gamescore/leaderboard/day/{day}/game/{gameType}
```

This endpoint should return an array of `GameScore` objects:

```typescript
interface GameScore {
  id: number;
  userId: number;
  day: number;
  gameType: string;
  score: number;
  playedAt: string;
  user: {
    id: number;
    unimicroId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}
```

Scores are automatically sorted by score (highest first) on the backend.

## States

### Loading State
Displays a spinner while fetching leaderboard data.

### Error State
Shows an error message if the API request fails.

### Empty State
Displays "No scores yet. Be the first to play!" if no scores exist.

### Populated State
Shows the leaderboard with all players, highlighting:
- Current user's entry (blue highlight)
- Current user's rank at the top
- Top 3 players with medal icons

## Styling

The component uses Tailwind CSS with:
- Gradient backgrounds
- Backdrop blur effects
- Responsive grid layouts
- Smooth transitions and hover effects
- Color-coded score badges

## Notes

- User identification is done via Clerk's `unimicroId`
- Display names use `firstName` and `lastName` if available, otherwise falls back to email prefix
- Timestamps are formatted to show month, day, hour, and minute
- The component automatically fetches fresh data on mount

