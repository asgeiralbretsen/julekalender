import {defineField} from 'sanity'

export const blurGuessGameFields = defineField({
  name: 'blurGuessGameData',
  title: 'Blur Guess Game Data',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'blurGuessGame',
  fields: [
    {
      name: 'images',
      title: 'Game Images',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              type: 'image',
              title: 'Image',
              options: {
                hotspot: true,
              },
              validation: (rule) => rule.required(),
            },
            {
              name: 'answer',
              type: 'string',
              title: 'Correct Answer',
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'answer',
              media: 'image',
            },
          },
        },
      ],
      validation: (rule) => rule.required().min(1),
    },
  ],
})
