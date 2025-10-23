import {defineField} from 'sanity'

export const blurGuessGameFields = defineField({
  name: 'blurGuessGameData',
  title: 'Gjett bildet spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'blurGuessGame',
  fields: [
    {
      name: 'images',
      title: 'Spillbilder',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              type: 'image',
              title: 'Bilde',
              options: {
                hotspot: true,
              },
              validation: (rule) => rule.required(),
            },
            {
              name: 'answer',
              type: 'string',
              title: 'Riktig svar',
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
