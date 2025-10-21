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
      name: 'game',
      title: 'Game',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Game Title',
          validation: (rule) => rule.required()
        },
        {
          name: 'description',
          type: 'text',
          title: 'Game Description',
          rows: 3
        },
        {
          name: 'instructions',
          type: 'array',
          title: 'Game Instructions',
          of: [{type: 'block'}]
        },
        {
          name: 'difficulty',
          type: 'string',
          title: 'Difficulty Level',
          options: {
            list: [
              {title: 'Easy', value: 'easy'},
              {title: 'Medium', value: 'medium'},
              {title: 'Hard', value: 'hard'}
            ],
            layout: 'radio'
          }
        },
        {
          name: 'estimatedTime',
          type: 'string',
          title: 'Estimated Time',
          description: 'e.g., "5 minutes", "10-15 minutes"'
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
