import {defineField} from 'sanity'

export const basicDayFields = [
  defineField({
    name: 'dayNumber',
    title: 'Day Number',
    type: 'number',
    validation: (rule) => rule.required().min(1).max(24),
    description: 'The day number in the advent calendar (1-24)',
  }),
  defineField({
    name: 'date',
    title: 'Date',
    type: 'date',
    validation: (rule) => rule.required(),
    description: 'The actual date for this advent day',
  }),
  defineField({
    name: 'title',
    title: 'Title',
    type: 'string',
    validation: (rule) => rule.required(),
    description: 'Title of the advent day',
  }),
  defineField({
    name: 'image',
    title: 'Day Image',
    type: 'image',
    options: {
      hotspot: true,
    },
    fields: [
      {
        name: 'alt',
        type: 'string',
        title: 'Alternative Text',
        description: 'Important for SEO and accessibility.',
      },
    ],
    validation: (rule) => rule.required(),
  }),
]

export const gameTypeField = defineField({
  name: 'gameType',
  title: 'Game Type',
  type: 'string',
  options: {
    list: [
      {title: 'No Game', value: 'none'},
      {title: 'Blur Guess Game', value: 'blurGuessGame'},
      {title: 'Color Match Game', value: 'colorMatchGame'},
      {title: 'Song Guess Game', value: 'songGuessGame'},
    ],
    layout: 'radio',
  },
  initialValue: 'none',
  description: 'Select the type of game for this advent day',
})

export const additionalFields = [
  defineField({
    name: 'content',
    title: 'Additional Content',
    type: 'array',
    of: [{type: 'block'}],
    description: 'Any additional content or story for this day',
  }),
  defineField({
    name: 'isUnlocked',
    title: 'Is Unlocked',
    type: 'boolean',
    initialValue: false,
    description: 'Whether this day is currently unlocked for users',
  }),
]
