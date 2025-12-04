import {defineField} from 'sanity'

export const emojiQuizFields = defineField({
  name: 'emojiQuizData',
  title: 'Emoji-rebus spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'emojiQuiz',
  fields: [
    defineField({
      name: 'words',
      title: 'Ord',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'emojis',
              title: 'Emoji-ord',
              type: 'string',
              validation: (rule) => rule.required(),
              description: 'Et ord bestående av emojier',
            }),
            defineField({
              name: 'word',
              title: 'Ord',
              type: 'string',
              validation: (rule) => rule.required(),
              description: 'Hva emoji-ordet betyr',
            }),
          ],
          preview: {
            select: {
              title: 'emoji',
              subtitle: 'word',
            },
          },
        },
      ],
      validation: (rule) => rule.required().min(3).max(20),
      description: 'Liste over emoji-ord',
    }),
  ],
})
