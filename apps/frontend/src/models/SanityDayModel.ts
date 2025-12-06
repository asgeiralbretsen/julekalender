import type {
  BlurGuessGameData,
  ColorMatchGameData,
  SongGuessGameData,
  QuizGameData,
  TeamsNotificationGameData,
  InterviewGameData,
  SnowflakeCatchGameData,
  WordScrambleGameData,
  EmojiQuizGameData,
} from "../models/GameDataModels";

export type GameType =
  | "none"
  | "blurGuessGame"
  | "colorMatchGame"
  | "quizGame"
  | "teamsNotificationGame"
  | "interviewGame"
  | "songGuessGame"
  | "snowflakeCatchGame"
  | "wordScrambleGame"
  | "emojiQuizGame";

export interface SanityDay {
  _id: string;
  dayNumber: number;
  date: string;
  title: string;
  image?: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  gameType?: GameType;
  blurGuessGameData?: BlurGuessGameData;
  colorMatchGameData?: ColorMatchGameData;
  songGuessGameData?: SongGuessGameData;
  quizGameData?: QuizGameData;
  teamsNotificationGameData?: TeamsNotificationGameData;
  interviewGameData?: InterviewGameData;
  snowflakeCatchGameData?: SnowflakeCatchGameData;
  wordScrambleGameData?: WordScrambleGameData;
  emojiQuizGameData?: EmojiQuizGameData;
  isUnlocked: boolean;
}
