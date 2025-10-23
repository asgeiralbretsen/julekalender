import { defineField } from 'sanity';

export const songGuessGameFields = [
  defineField({
    name: 'songGuessGameData',
    title: 'Gjett julesangen data',
    type: 'object',
    hidden: ({parent}) => parent?.gameType !== 'songGuessGame',
    fields: [
      {
        name: 'title',
        title: 'Spilltittel',
        type: 'string',
        initialValue: 'Gjett julesangen! 🎵',
      },
      {
        name: 'description',
        title: 'Spillbeskrivelse',
        type: 'text',
        initialValue: 'Lytt til klippet og gjett hvilken julesang det er!',
      },
      {
        name: 'songFile',
        title: 'Sang-lydfil (.mp3)',
        type: 'file',
        description: 'Last opp MP3-lydfilen for sangklippet',
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
        title: 'Klippvarighet (sekunder)',
        type: 'number',
        description: 'Hvor lenge lydklippet spiller',
        initialValue: 10,
        validation: (Rule) => Rule.required().min(5).max(30),
      },
      {
        name: 'scoringSettings',
        title: 'Poenginnstillinger',
        type: 'object',
        validation: (Rule) => Rule.required(),
        fields: [
          {
            name: 'correctAnswerPoints',
            title: 'Poeng for riktig svar',
            type: 'number',
            initialValue: 1000,
            validation: (Rule) => Rule.required().min(0),
          },
          {
            name: 'timeBonusPerSecond',
            title: 'Tidsbonus per sekund gjenstående',
            type: 'number',
            description: 'Bonuspoeng per sekund som er igjen',
            initialValue: 50,
            validation: (Rule) => Rule.required().min(0),
          },
          {
            name: 'maxTimeBonus',
            title: 'Maks tidsbonus',
            type: 'number',
            initialValue: 500,
            validation: (Rule) => Rule.required().min(0),
          },
        ],
      },
    ],
  }),
];

