import {defineField} from 'sanity'

export const colorMatchGameFields = defineField({
  name: 'colorMatchGameData',
  title: 'Fargetilpasning spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'colorMatchGame',
  fields: [
    defineField({
      name: 'title',
      title: 'Spilltittel',
      type: 'string',
      description: 'Tittelen på dette fargetilpasningsspillet',
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      rows: 3,
      description: 'Kort beskrivelse av spillet',
    }),
    defineField({
      name: 'stockingColors',
      title: 'Sokkefarger',
      type: 'object',
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
      description: 'Definer fargene for målsokken som spillere skal matche',
    }),
    defineField({
      name: 'scoringSettings',
      title: 'Poengsuminnstillinger',
      type: 'object',
      fields: [
        defineField({
          name: 'perfectMatchBonus',
          title: 'Perfekt match-bonus',
          type: 'number',
          initialValue: 50,
          description: 'Bonuspoeng for perfekte fargetreff',
        }),
        defineField({
          name: 'closeMatchThreshold',
          title: 'Nærme match-terskel',
          type: 'number',
          initialValue: 80,
          description: 'Prosentvis terskel for å vurdere et treff som "nært"',
        }),
        defineField({
          name: 'timeBonus',
          title: 'Tidsbonusmultiplikator',
          type: 'number',
          initialValue: 1.5,
          description: 'Multiplikator for tidsbaserte bonuser',
        }),
      ],
      description: 'Konfigurer hvordan poengsum fungerer for dette spillet',
    }),
  ],
})
