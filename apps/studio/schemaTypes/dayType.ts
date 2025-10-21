import {defineType} from 'sanity'
import {basicDayFields, gameTypeField, additionalFields} from './fields/dayFields'
import {blurGuessGameFields} from './fields/blurGuessFields'
import {colorMatchGameFields} from './fields/colorMatchFileds'

export const dayType = defineType({
  name: 'day',
  title: 'Advent Day',
  type: 'document',
  fields: [
    ...basicDayFields,
    gameTypeField,
    blurGuessGameFields,
    colorMatchGameFields,
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
        title: `Day ${dayNumber}: ${title}`,
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Day Number',
      name: 'dayNumberAsc',
      by: [{field: 'dayNumber', direction: 'asc'}],
    },
  ],
})
