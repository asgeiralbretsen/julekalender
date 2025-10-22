import { defineField } from 'sanity';

export const songGuessGameFields = [
  defineField({
    name: 'songGuessGameData',
    title: 'Song Guess Game Data',
    type: 'object',
    fields: [
      {
        name: 'title',
        title: 'Game Title',
        type: 'string',
        initialValue: 'Guess the Christmas Song! 🎵',
      },
      {
        name: 'description',
        title: 'Game Description',
        type: 'text',
        initialValue: 'Listen to the clip and guess which Christmas song it is!',
      },
      {
        name: 'songFile',
        title: 'Song Audio File (.mp3)',
        type: 'file',
        description: 'Upload the MP3 audio file for the song clip',
        options: {
          accept: 'audio/mpeg,.mp3',
        },
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'correctAnswer',
        title: 'Correct Answer',
        type: 'string',
        description: 'The correct song title',
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'answerOptions',
        title: 'Answer Options',
        type: 'array',
        of: [{ type: 'string' }],
        description: 'List of answer options (should include the correct answer)',
        validation: (Rule) => Rule.required().min(3).max(6),
      },
      {
        name: 'clipDuration',
        title: 'Clip Duration (seconds)',
        type: 'number',
        description: 'How long the audio clip plays',
        initialValue: 10,
        validation: (Rule) => Rule.required().min(5).max(30),
      },
      {
        name: 'scoringSettings',
        title: 'Scoring Settings',
        type: 'object',
        fields: [
          {
            name: 'correctAnswerPoints',
            title: 'Points for Correct Answer',
            type: 'number',
            initialValue: 1000,
          },
          {
            name: 'timeBonusPerSecond',
            title: 'Time Bonus Per Second Remaining',
            type: 'number',
            description: 'Bonus points per second remaining',
            initialValue: 50,
          },
          {
            name: 'maxTimeBonus',
            title: 'Maximum Time Bonus',
            type: 'number',
            initialValue: 500,
          },
        ],
      },
    ],
  }),
];

