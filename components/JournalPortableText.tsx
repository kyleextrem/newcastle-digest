'use client'

import Image from 'next/image'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { TypedObject } from '@portabletext/types'
import { urlFor } from '@/lib/sanity'

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-12 mb-4 font-sans-main text-3xl font-black uppercase tracking-tighter text-[#251f18] md:text-4xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 mb-3 font-sans-main text-2xl font-black uppercase tracking-tighter text-[#251f18] md:text-3xl">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-8 mb-2 font-sans-main text-xl font-black uppercase tracking-tighter text-[#251f18]">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="mb-6 font-sans-main text-lg leading-[1.75] text-[#251f18]/85">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-4 border-[#849bff] pl-6 font-sans-main text-lg leading-relaxed text-[#251f18]/70">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-6 list-disc space-y-2 pl-6 font-sans-main text-lg leading-relaxed text-[#251f18]/85">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-6 list-decimal space-y-2 pl-6 font-sans-main text-lg leading-relaxed text-[#251f18]/85">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-bold text-[#251f18]">{children}</strong>
    ),
    em: ({ children }) => <span className="font-medium">{children}</span>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.href?.startsWith('http') ? '_blank' : undefined}
        rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="text-[#849bff] underline underline-offset-2 transition-opacity hover:opacity-70"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null
      const src = urlFor(value).width(1200).url()
      return (
        <figure className="my-10">
          <div className="relative aspect-video w-full overflow-hidden rounded-[24px]">
            <Image
              src={src}
              alt={value.alt || ''}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-center font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/50">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}

export function JournalPortableText({ value }: { value: TypedObject[] }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PortableText value={value} components={components} />
    </div>
  )
}
