import {defineField} from 'sanity'

export const snowflakeCatchGameFields = defineField({
  name: 'snowflakeCatchGameData',
  title: 'Snøflake fangst spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'snowflakeCatchGame',
  fields: [
    defineField({
      name: 'title',
      title: 'Spilltittel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
