import {defineField} from 'sanity'

export const basicDayFields = [
  defineField({
    name: 'dayNumber',
    title: 'Dagnummer',
    type: 'number',
    validation: (rule) => rule.required().min(1).max(24),
    description: 'Dagnummeret i julekalenderen (1-24)',
  }),
  defineField({
    name: 'date',
    title: 'Dato',
    type: 'date',
    validation: (rule) => rule.required(),
    description: 'Den faktiske datoen for denne kalenderdagen',
  }),
  defineField({
    name: 'title',
    title: 'Tittel',
    type: 'string',
    validation: (rule) => rule.required(),
    description: 'Tittel på kalenderdagen',
  }),
  defineField({
    name: 'image',
    title: 'Dagbilde',
    type: 'image',
    options: {
      hotspot: true,
    },
    fields: [
      {
        name: 'alt',
        type: 'string',
        title: 'Alternativ tekst',
        description: 'Viktig for SEO og tilgjengelighet.',
      },
    ],
    validation: (rule) => rule.required(),
  }),
]

export const gameTypeField = defineField({
  name: 'gameType',
  title: 'Spilltype',
  type: 'string',
  options: {
    list: [
      {title: 'Ingen spill', value: 'none'},
      {title: 'Gjett bildet', value: 'blurGuessGame'},
      {title: 'Fargetilpasning', value: 'colorMatchGame'},
      {title: 'Quiz', value: 'quizGame'},
      {title: 'Teams Notification Game', value: 'teamsNotificationGame'},
      {title: 'Intervju', value: 'interviewGame'},
      {title: 'Song Guess Game', value: 'songGuessGame'},
      {title: 'Snowflake Catch Game', value: 'snowflakeCatchGame'},
    ],
    layout: 'radio',
  },
  initialValue: 'none',
  description: 'Velg spilltypen for denne kalenderdagen',
})

export const additionalFields = [
  defineField({
    name: 'content',
    title: 'Ekstra innhold',
    type: 'array',
    of: [{type: 'block'}],
    description: 'Ekstra innhold eller historie for denne dagen',
  }),
  defineField({
    name: 'isUnlocked',
    title: 'Er låst opp',
    type: 'boolean',
    initialValue: false,
    description: 'Om denne dagen er låst opp for brukere',
  }),
]
