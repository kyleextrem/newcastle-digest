import { defineArrayMember, defineField, defineType } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      description: 'Journal is the default. Leave this blank on existing Newcastle Digest stories. Choose Getaways for travel stories.',
      initialValue: 'journal',
      options: {
        list: [
          { title: 'Journal', value: 'journal' },
          { title: 'Getaways', value: 'getaways' },
        ],
        layout: 'radio',
      },
      validation: (Rule) =>
        Rule.custom((value) => {
          if (value == null || value === '') return true
          if (value === 'journal' || value === 'getaways') return true
          return 'Choose Journal or Getaways'
        }),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      description: 'Optional. Shown on the article when you want to mark a revision.',
      hidden: ({ document }) => document?.section !== 'getaways',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      hidden: ({ document }) => document?.section === 'getaways',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const section = (context.document as { section?: string } | undefined)?.section
          if (section === 'getaways') return true
          return value ? true : 'Category is required for Journal posts'
        }),
    }),
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'reference',
      to: [{ type: 'destination' }],
      description: 'Where this getaway goes. Create a destination only when a story needs it.',
      hidden: ({ document }) => document?.section !== 'getaways',
    }),
    defineField({
      name: 'tripType',
      title: 'Trip type',
      type: 'string',
      description: 'Optional. Describes the kind of trip.',
      hidden: ({ document }) => document?.section !== 'getaways',
      options: {
        list: [
          { title: 'Weekend trips', value: 'weekend-trips' },
          { title: 'Hotels', value: 'hotels' },
          { title: 'Food & drink', value: 'food-drink' },
          { title: 'Road trips', value: 'road-trips' },
          { title: 'Things to do', value: 'things-to-do' },
          { title: 'Itineraries', value: 'itineraries' },
          { title: 'Couples', value: 'couples' },
          { title: 'Family', value: 'family' },
          { title: 'Luxury', value: 'luxury' },
          { title: 'Budget', value: 'budget' },
        ],
      },
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule) =>
                      Rule.uri({
                        allowRelative: true,
                        scheme: ['http', 'https', 'mailto', 'tel'],
                      }),
                  },
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        }),
        defineArrayMember({
          name: 'mapEmbed',
          title: 'Map Embed',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              description: 'Optional title for the map (used as iframe title for accessibility)',
            }),
            defineField({
              name: 'query',
              title: 'Query',
              type: 'string',
              description: 'Cafe name + address to search for on Google Maps',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              query: 'query',
            },
            prepare({ title, query }) {
              return {
                title: title || 'Map Embed',
                subtitle: query || 'No query set',
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'string',
    }),
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'coverImage',
      section: 'section',
    },
    prepare({ title, author, media, section }) {
      const sectionLabel = section === 'getaways' ? 'Getaways' : 'Journal'
      const byline = author ? `by ${author}` : ''
      return {
        title,
        subtitle: [sectionLabel, byline].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
