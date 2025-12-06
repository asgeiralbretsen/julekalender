export interface BlurGuessGameData {
  images: Array<{
    image: {
      asset: {
        _ref: string;
      };
    };
    answer: string;
  }>;
}

export interface ColorMatchGameData {
  title: string;
  description: string;
  stockingColors: {
    topColor: { hex: string };
    topStripesColor: { hex: string };
    mainColor: { hex: string };
    heelColor: { hex: string };
    stripesColor: { hex: string };
  };
  scoringSettings: {
    perfectMatchBonus: number;
    closeMatchThreshold: number;
    timeBonus: number;
  };
}
export interface SongGuessGameData {
  title: string;
  description: string;
  songs: Array<{
    songFile: {
      asset: {
        _ref: string;
        url?: string;
      };
    };
    answers: string[];
    correctAnswerIndex: number;
    clipDuration: number;
  }>;
  scoringSettings?: {
    correctAnswerPoints?: number;
    timeBonusPerSecond?: number;
    maxTimeBonus?: number;
  };
}
export interface QuizGameData {
  title: string;
  description: string;
  questions: Array<{
    questionText: string;
    answers: string[];
    correctAnswerIndex: number;
    timeLimit: number;
  }>;
  scoringSettings: {
    correctAnswerPoints: number;
    timeBonus: number;
  };
}
export interface TeamsNotificationGameData {
  title: string;
  description: string;
  firstMessage: string;
  teamsMessages: Array<{
    message: string;
    sender?: string;
    timestamp?: string;
    profilePicture?: {
      _ref: string;
      _type: "reference";
    };
  }>;
  lastMessage: string;
  logo?: {
    asset: {
      _ref: string;
    };
  };
  defaultProfilePicture?: {
    _ref: string;
    _type: "reference";
  };
  contextMenuIcon?: {
    asset: {
      _ref: string;
    };
  };
  addEmojiIcon?: {
    asset: {
      _ref: string;
    };
  };
  closeMessageIcon?: {
    asset: {
      _ref: string;
    };
  };
  sendMessageIcon?: {
    asset: {
      _ref: string;
    };
  };
}

export interface InterviewGameInterviewer {
  name: string;
  image: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  role?: string;
}

export interface InterviewGameData {
  title: string;
  description: string;
  interviewers: Array<InterviewGameInterviewer>;
  questions: Array<{
    questionText: string;
    answers: string[];
    correctAnswerIndex: number;
    timeLimit: number;
  }>;
  scoringSettings: {
    correctAnswerPoints: number;
    timeBonus: number;
    perfectScoreBonus: number;
  };
}

export interface SnowflakeCatchGameData {
  title: string;
}

export interface WordScrambleGameData {
  title: string;
  description?: string;
  words: Array<{
    word: string;
    hint?: string;
  }>;
  timeLimit: number;
  scoringSettings: {
    correctAnswerPoints: number;
    timeBonusPerSecond: number;
  };
}

export interface EmojiGameWord {
  emojis: string;
  word: string;
}

export interface EmojiQuizGameData {
  title: string;
  words: Array<EmojiGameWord>;
}
