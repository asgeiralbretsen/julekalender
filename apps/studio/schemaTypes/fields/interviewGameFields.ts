import {defineField} from 'sanity'

export const interviewGameFields = defineField({
  name: 'interviewGameData',
  title: 'Intervju spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'interviewGame',
  fields: [
    defineField({
      name: 'title',
      title: 'Intervju-tittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Intervju-beskrivelse',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'interviewers',
      title: 'Intervjuere',
      type: 'array',
      validation: (rule) => rule.required().length(2),
      description: 'Nøyaktig 2 intervjuere',
      of: [
        {
          type: 'object',
          name: 'interviewer',
          title: 'Intervjuer',
          fields: [
            defineField({
              name: 'name',
              title: 'Navn',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'image',
              title: 'Bilde',
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alternativ tekst',
                },
              ],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Rolle',
              type: 'string',
              description: 'F.eks. "HR Manager", "Tech Lead", "CEO"',
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'role',
              media: 'image',
            },
          },
        },
      ],
    }),
    defineField({
      name: 'questions',
      title: 'Intervju-spørsmål',
      type: 'array',
      validation: (rule) => rule.required().min(3),
      description: 'Minst 3 spørsmål til intervjuet',
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
              initialValue: 20,
              validation: (rule) => rule.required().min(10).max(60),
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
          initialValue: 3,
          description: 'Poeng per gjenværende sekund',
        }),
        defineField({
          name: 'perfectScoreBonus',
          title: 'Perfekt score bonus',
          type: 'number',
          initialValue: 200,
          description: 'Bonuspoeng for å få alle spørsmål riktig',
        }),
      ],
    }),
  ],
})
