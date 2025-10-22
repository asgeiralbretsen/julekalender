import {defineField} from 'sanity'

export const quizGameFields = defineField({
  name: 'quizGameData',
  title: 'Quiz spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'quizGame',
  fields: [
    defineField({
      name: 'title',
      title: 'Quiz-tittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Quiz-beskrivelse',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'questions',
      title: 'Quiz-spørsmål',
      type: 'array',
      validation: (rule) => rule.required().length(3),
      description: 'Nøyaktig 3 spørsmål til quizen',
      of: [
        {
          type: 'object',
          name: 'question',
          title: 'Spørsmål',
          fields: [
            defineField({
              name: 'questionText',
              title: 'Spørsmålstekst',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
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
            defineField({
              name: 'timeLimit',
              title: 'Tidsbegrensning (sekunder)',
              type: 'number',
              initialValue: 15,
              validation: (rule) => rule.required().min(5).max(60),
            }),
          ],
          preview: {
            select: {
              title: 'questionText',
              correctIndex: 'correctAnswerIndex',
            },
            prepare({title, correctIndex}) {
              return {
                title: title,
                subtitle: `Riktig svar: ${correctIndex + 1}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'scoringSettings',
      title: 'Poengsuminnstillinger',
      type: 'object',
      fields: [
        defineField({
          name: 'correctAnswerPoints',
          title: 'Poeng per riktig svar',
          type: 'number',
          initialValue: 100,
        }),
        defineField({
          name: 'timeBonus',
          title: 'Tidsbonusmultiplikator',
          type: 'number',
          initialValue: 2,
          description: 'Poeng per gjenværende sekund',
        }),
      ],
    }),
  ],
})

