import {defineField, defineType} from 'sanity'

export const dayType = defineType({
  name: 'day',
  title: 'Advent Day',
  type: 'document',
  fields: [
    defineField({
      name: 'dayNumber',
      title: 'Day Number',
      type: 'number',
      validation: (rule) => rule.required().min(1).max(24),
      description: 'The day number in the advent calendar (1-24)'
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (rule) => rule.required(),
      description: 'The actual date for this advent day'
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Title of the advent day'
    }),
    defineField({
      name: 'image',
      title: 'Day Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility.'
        }
      ],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'gameType',
      title: 'Game Type',
      type: 'string',
      options: {
        list: [
          {title: 'No Game', value: 'none'},
          {title: 'Blur Guess Game', value: 'blurGuessGame'}
        ],
        layout: 'radio'
      },
      initialValue: 'none',
      description: 'Select the type of game for this advent day'
    }),
    defineField({
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
                    hotspot: true
                  },
                  validation: (rule) => rule.required()
                },
                {
                  name: 'answer',
                  type: 'string',
                  title: 'Correct Answer',
                  validation: (rule) => rule.required()
                },
              ],
              preview: {
                select: {
                  title: 'answer',
                  media: 'image'
                }
              }
            }
          ],
          validation: (rule) => rule.required().min(1)
        }
      ]
    }),
    defineField({
      name: 'content',
      title: 'Additional Content',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Any additional content or story for this day'
    }),
    defineField({
      name: 'isUnlocked',
      title: 'Is Unlocked',
      type: 'boolean',
      initialValue: false,
      description: 'Whether this day is currently unlocked for users'
    })
  ],
  preview: {
    select: {
      title: 'title',
      dayNumber: 'dayNumber',
      media: 'image'
    },
    prepare(selection) {
      const {title, dayNumber, media} = selection
      return {
        title: `Day ${dayNumber}: ${title}`,
        media: media
      }
    }
  },
  orderings: [
    {
      title: 'Day Number',
      name: 'dayNumberAsc',
      by: [
        {field: 'dayNumber', direction: 'asc'}
      ]
    }
  ]
})
