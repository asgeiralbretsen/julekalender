import { defineField } from 'sanity';

export const songGuessGameFields = [
  defineField({
    name: 'songGuessGameData',
    title: 'Song Guess Game Data',
    type: 'object',
    hidden: ({parent}) => parent?.gameType !== 'songGuessGame',
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
      defineField({
        name: 'answers',
        title: 'Svaralternativer',
        type: 'array',
        validation: (rule) => rule.required().length(4),
        description: 'Nøyaktig 4 svaralternativer',
        of: [{type: 'string'}],
      }),
      defineField({
        name: 'correctAnswerIndex',
        title: 'Riktig svar',
        type: 'number',
        description: 'Indeks for riktig svar (0-3)',
        validation: (rule) => rule.required().min(0).max(3),
        options: {
          list: [
            {title: 'Svar 1', value: 0},
            {title: 'Svar 2', value: 1},
            {title: 'Svar 3', value: 2},
            {title: 'Svar 4', value: 3},
          ],
        },
      }),
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
        validation: (Rule) => Rule.required(),
        fields: [
          {
            name: 'correctAnswerPoints',
            title: 'Points for Correct Answer',
            type: 'number',
            initialValue: 1000,
            validation: (Rule) => Rule.required().min(0),
          },
          {
            name: 'timeBonusPerSecond',
            title: 'Time Bonus Per Second Remaining',
            type: 'number',
            description: 'Bonus points per second remaining',
            initialValue: 50,
            validation: (Rule) => Rule.required().min(0),
          },
          {
            name: 'maxTimeBonus',
            title: 'Maximum Time Bonus',
            type: 'number',
            initialValue: 500,
            validation: (Rule) => Rule.required().min(0),
          },
        ],
      },
    ],
  }),
];

