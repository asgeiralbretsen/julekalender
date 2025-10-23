import {defineField} from 'sanity'

export const wordScrambleGameFields = defineField({
  name: 'wordScrambleGameData',
  title: 'Juleord Scramble spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'wordScrambleGame',
  fields: [
    defineField({
      name: 'title',
      title: 'Spilltittel',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Tittelen på dette ordspillet',
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      rows: 3,
      description: 'Kort beskrivelse av spillet',
    }),
    defineField({
      name: 'words',
      title: 'Ord',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'word',
              title: 'Ord',
              type: 'string',
              validation: (rule) => rule.required(),
              description: 'Ordet som skal stokkes (f.eks. "juletre")',
            }),
            defineField({
              name: 'hint',
              title: 'Hint (valgfritt)',
              type: 'string',
              description: 'Et hint for å hjelpe spilleren (f.eks. "Dekorasjon")',
            }),
          ],
          preview: {
            select: {
              title: 'word',
              subtitle: 'hint',
            },
          },
        },
      ],
      validation: (rule) => rule.required().min(3).max(20),
      description: 'Liste over ord som skal stokkes (minimum 3, maksimum 20)',
    }),
    defineField({
      name: 'timeLimit',
      title: 'Tidsgrense per ord (sekunder)',
      type: 'number',
      initialValue: 30,
      validation: (rule) => rule.required().min(10).max(120),
      description: 'Hvor mange sekunder spilleren har på å gjette hvert ord',
    }),
    defineField({
      name: 'scoringSettings',
      title: 'Poengsuminnstillinger',
      type: 'object',
      fields: [
        defineField({
          name: 'correctAnswerPoints',
          title: 'Poeng for riktig svar',
          type: 'number',
          initialValue: 100,
          validation: (rule) => rule.required().min(0).max(1000),
          description: 'Poeng for hvert riktig ord',
        }),
        defineField({
          name: 'timeBonusPerSecond',
          title: 'Tidsbonuspoeng per sekund',
          type: 'number',
          initialValue: 5,
          validation: (rule) => rule.required().min(0).max(50),
          description: 'Ekstra poeng per sekund som er igjen',
        }),
      ],
      description: 'Konfigurer hvordan poengsum fungerer for dette spillet',
    }),
  ],
})
