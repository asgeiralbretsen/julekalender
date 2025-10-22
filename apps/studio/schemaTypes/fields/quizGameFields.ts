import {defineField} from 'sanity'

export const quizGameFields = defineField({
  name: 'quizGameData',
  title: 'Quiz Game Data',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'quizGame',
  fields: [
    defineField({
      name: 'title',
      title: 'Quiz Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Quiz Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'questions',
      title: 'Quiz Questions',
      type: 'array',
      validation: (rule) => rule.required().length(3),
      description: 'Exactly 3 questions for the quiz',
      of: [
        {
          type: 'object',
          name: 'question',
          title: 'Question',
          fields: [
            defineField({
              name: 'questionText',
              title: 'Question Text',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'answers',
              title: 'Answer Options',
              type: 'array',
              validation: (rule) => rule.required().length(4),
              description: 'Exactly 4 answer options',
              of: [{type: 'string'}],
            }),
            defineField({
              name: 'correctAnswerIndex',
              title: 'Correct Answer',
              type: 'number',
              description: 'Index of the correct answer (0-3)',
              validation: (rule) => rule.required().min(0).max(3),
              options: {
                list: [
                  {title: 'Answer 1', value: 0},
                  {title: 'Answer 2', value: 1},
                  {title: 'Answer 3', value: 2},
                  {title: 'Answer 4', value: 3},
                ],
              },
            }),
            defineField({
              name: 'timeLimit',
              title: 'Time Limit (seconds)',
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
                subtitle: `Correct answer: ${correctIndex + 1}`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'scoringSettings',
      title: 'Scoring Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'correctAnswerPoints',
          title: 'Points per Correct Answer',
          type: 'number',
          initialValue: 100,
        }),
        defineField({
          name: 'timeBonus',
          title: 'Time Bonus Multiplier',
          type: 'number',
          initialValue: 2,
          description: 'Points per second remaining',
        }),
      ],
    }),
  ],
})

