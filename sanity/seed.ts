/**
 * Seed categories and the default author for Newcastle Digest Journal.
 *
 * Usage (with env vars set):
 *   npx sanity@latest exec sanity/seed.ts --with-user-token
 *
 * Or from Studio: create these documents manually using the titles/slugs below.
 */

import { getCliClient } from 'sanity/cli'

const client = getCliClient({ apiVersion: '2025-01-01' })

const CATEGORIES = [
  { title: 'Food & Drink', slug: 'food-drink', description: 'Restaurants, cafes, bars, and culinary finds across Newcastle.' },
  { title: 'Live Music', slug: 'live-music', description: 'Gigs, venues, and the local music scene.' },
  { title: 'Events', slug: 'events', description: 'Whats on: festivals, openings, and nights out.' },
  { title: 'Guides', slug: 'guides', description: 'Practical guides to getting the most out of Newcastle.' },
  { title: 'Arts & Culture', slug: 'arts-culture', description: 'Galleries, theatre, design, and creative culture.' },
  { title: 'Markets', slug: 'markets', description: 'Growers markets, makers markets, and weekend stalls.' },
]

async function seed() {
  const existingCategories = await client.fetch<number>('count(*[_type == "category"])')
  const existingAuthors = await client.fetch<number>('count(*[_type == "author"])')

  const transaction = client.transaction()

  if (existingCategories === 0) {
    for (const category of CATEGORIES) {
      transaction.create({
        _type: 'category',
        title: category.title,
        slug: { _type: 'slug', current: category.slug },
        description: category.description,
      })
    }
    console.log(`Creating ${CATEGORIES.length} categories...`)
  } else {
    console.log('Categories already exist, skipping.')
  }

  if (existingAuthors === 0) {
    transaction.create({
      _type: 'author',
      name: 'Newcastle Digest',
      bio: 'Independently curated stories, guides, and dispatches from Newcastle, NSW.',
    })
    console.log('Creating author: Newcastle Digest...')
  } else {
    console.log('Authors already exist, skipping.')
  }

  await transaction.commit()
  console.log('Seed complete.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
