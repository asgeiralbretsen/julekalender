import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: '54fixmwv',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for better performance
  token: import.meta.env.VITE_SANITY_TOKEN || '', // Public read token from environment
})
