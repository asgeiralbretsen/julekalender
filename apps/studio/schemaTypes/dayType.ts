import {defineType} from 'sanity'
import {basicDayFields, gameTypeField, additionalFields} from './fields/dayFields'
import {blurGuessGameFields} from './fields/blurGuessFields'
import {colorMatchGameFields} from './fields/colorMatchFileds'
import {songGuessGameFields} from './fields/songGuessFields'
import {quizGameFields} from './fields/quizGameFields'
import {teamsNotificationGameFields} from './fields/TeamsNotificationFields'

export const dayType = defineType({
  name: 'day',
  title: 'Kalenderdag',
  type: 'document',
  fields: [
    ...basicDayFields,
    gameTypeField,
    blurGuessGameFields,
    colorMatchGameFields,
    quizGameFields,
    teamsNotificationGameFields,
    ...songGuessGameFields,
    ...additionalFields,
  ],
  preview: {
    select: {
      title: 'title',
      dayNumber: 'dayNumber',
      media: 'image',
    },
    prepare(selection) {
      const {title, dayNumber, media} = selection
      return {
        title: `Dag ${dayNumber}: ${title}`,
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Dagnummer',
      name: 'dayNumberAsc',
      by: [{field: 'dayNumber', direction: 'asc'}],
    },
  ],
})
