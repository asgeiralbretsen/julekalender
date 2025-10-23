import {defineField} from 'sanity'

export const blurGuessGameFields = defineField({
  name: 'blurGuessGameData',
  title: 'Gjett bildet spilldata',
  type: 'object',
  hidden: ({parent}) => parent?.gameType !== 'blurGuessGame',
  fields: [
    {
      name: 'images',
      title: 'Spillbilder',
      type: 'array',
      description: 'Legg til bilder med svaralternativer. Det riktige svaret må være inkludert i alternativene.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              type: 'image',
              title: 'Bilde',
              options: {
                hotspot: true,
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'question',
              type: 'string',
              title: 'Spørsmål',
              description: 'Spørsmålet som vises for dette bildet (f.eks. "Hvilket fjell er dette?")',
              initialValue: 'Hva ser du?',
            },
            {
              name: 'answer',
              type: 'string',
              title: 'Riktig svar',
              description: 'Dette må være ett av svaralternativene under',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'options',
              type: 'array',
              title: 'Svaralternativer',
              description: 'Alle alternativene spilleren kan velge mellom (inkluder det riktige svaret)',
              of: [{type: 'string'}],
              validation: (Rule) => 
                Rule.required()
                  .min(4)
                  .max(6)
                  .custom((options: string[] | undefined, context) => {
                    const answer = (context.parent as any)?.answer;
                    if (!answer) return true;
                    if (!options) return 'Svaralternativer er påkrevd';
                    if (!options.includes(answer)) {
                      return `Det riktige svaret "${answer}" må være ett av alternativene`;
                    }
                    return true;
                  }),
            },
          ],
          preview: {
            select: {
              title: 'answer',
              media: 'image',
              options: 'options',
            },
            prepare({title, media, options}) {
              return {
                title: `Svar: ${title}`,
                subtitle: options ? `${options.length} alternativer` : 'Ingen alternativer',
                media: media,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    },
  ],
})
