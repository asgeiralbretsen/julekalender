import {defineField} from 'sanity'

export const colorMatchGameFields = defineField({
  name: 'colorMatchGameData',
  title: 'Fargetilpasning spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'colorMatchGame',
  fields: [
    defineField({
      name: 'stockings',
      title: 'Sokker',
      type: 'array',
      description: 'Legg til ett eller flere sokkeoppsett som spillere skal matche',
      of: [
        {
          type: 'object',
          title: 'Sokk',
          fields: [
            defineField({
              name: 'topColor',
              title: 'Toppfarge',
              type: 'string',
              description: 'Fargen på toppdelen av sokken (f.eks. #ff0000 eller red)',
            }),
            defineField({
              name: 'topStripesColor',
              title: 'Toppstripefarge',
              type: 'string',
              description: 'Fargen på stripene i toppdelen (f.eks. #800080 eller purple)',
            }),
            defineField({
              name: 'mainColor',
              title: 'Hovedfarge',
              type: 'string',
              description: 'Hovedfargen på sokken (f.eks. #008000 eller green)',
            }),
            defineField({
              name: 'heelColor',
              title: 'Hælfarge',
              type: 'string',
              description: 'Fargen på hælen (f.eks. #ffff00 eller yellow)',
            }),
            defineField({
              name: 'stripesColor',
              title: 'Stripefarge',
              type: 'string',
              description: 'Fargen på de dekorative stripene (f.eks. #800080 eller purple)',
            }),
          ],
        },
      ],
    }),
  ],
})
