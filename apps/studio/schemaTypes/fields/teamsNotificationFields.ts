import {defineField} from 'sanity'

export const teamsNotificationGameFields = defineField({
  name: 'teamsNotificationGameData',
  title: 'Teams Notification Game Data',
  type: 'object',
  hidden: ({parent}) => {
    console.log('Teams Notification Game - parent gameType:', parent?.gameType)
    console.log('Teams Notification Game - parent object:', parent)
    return parent?.gameType !== 'teamsNotificationGame'
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Game Title',
      type: 'string',
      validation: (rule) => rule.required().max(100),
      description: 'The title of this teams notification game',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of the game',
    }),
    defineField({
      name: 'firstMessage',
      title: 'First Message',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The initial message shown when the game starts',
    }),
    defineField({
      name: 'teamsMessages',
      title: 'Teams Messages',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'message',
              type: 'string',
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: {
              message: 'message',
            },
            prepare(selection) {
              const {message} = selection
              return {
                title: message,
              }
            },
          },
        },
      ],
      description: 'Add as many team messages as needed for the game',
    }),
    defineField({
      name: 'lastMessage',
      title: 'Last Message',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The final message shown when the game ends',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'The Teams logo used in the notification',
    }),
    defineField({
      name: 'contextMenuIcon',
      title: 'Context Menu Icon',
      type: 'image',
      description: 'The context menu icon shown in the notification',
    }),
    defineField({
      name: 'addEmojiIcon',
      title: 'Add Emoji Icon',
      type: 'image',
      description: 'The add emoji icon shown in the notification',
    }),
    defineField({
      name: 'closeMessageIcon',
      title: 'Close Message Icon',
      type: 'image',
      description: 'The close message icon shown in the notification',
    }),
    defineField({
      name: 'sendMessageIcon',
      title: 'Send Message Icon',
      type: 'image',
      description: 'The send message icon shown in the notification',
    }),
  ],
})
