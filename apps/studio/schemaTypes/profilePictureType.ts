import {defineType} from 'sanity'

export const profilePictureType = defineType({
  name: 'profilePicture',
  title: 'Profile Picture',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'Name or identifier for this profile picture',
    },
    {
      name: 'image',
      title: 'Profile Picture',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for accessibility and SEO.',
        },
      ],
      validation: (rule) => rule.required(),
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
    prepare(selection) {
      const {title, media} = selection
      return {
        title: title || 'Untitled Profile Picture',
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}],
    },
    {
      title: 'Name Z-A',
      name: 'nameDesc',
      by: [{field: 'name', direction: 'desc'}],
    },
  ],
})
