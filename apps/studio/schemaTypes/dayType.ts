import {defineType} from 'sanity'
import {basicDayFields, gameTypeField, additionalFields} from './fields/dayFields'
import {blurGuessGameFields} from './fields/blurGuessFields'
import {colorMatchGameFields} from './fields/colorMatchFileds'
import {songGuessGameFields} from './fields/songGuessFields'
import {quizGameFields} from './fields/quizGameFields'
import {teamsNotificationGameFields} from './fields/TeamsNotificationFields'
import {interviewGameFields} from './fields/interviewGameFields'
import {snowflakeCatchGameFields} from './fields/snowflakeCatchFields'
import {wordScrambleGameFields} from './fields/wordScrambleFields'

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
    interviewGameFields,
    ...songGuessGameFields,
    snowflakeCatchGameFields,
    wordScrambleGameFields,
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
