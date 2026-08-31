import Image from 'next/image'
import Link from 'next/link'
import { urlFor, type JournalPost } from '@/lib/sanity'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function JournalCard({ post }: { post: JournalPost }) {
  const imageUrl = post.coverImage
    ? urlFor(post.coverImage).width(800).height(450).fit('crop').url()
    : null

  return (
    <article className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.01]">
      <Link href={`/journal/${post.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden rounded-t-[24px] bg-[#f5f4f0]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.coverImage?.alt || post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f5f4f0]">
              <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/30">
                No image
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        {post.category?.title && (
          <p className="mb-3 font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]">
            {post.category.title}
          </p>
        )}

        <Link href={`/journal/${post.slug}`}>
          <h3 className="font-sans-main text-xl font-black uppercase tracking-tighter leading-tight text-[#251f18] transition-colors group-hover:text-[#849bff] md:text-2xl">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="mt-3 font-sans-main text-base font-normal leading-relaxed text-[#251f18]/60 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 pt-5">
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt}
              className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/40"
            >
              {formatDate(post.publishedAt)}
            </time>
          )}
          <Link
            href={`/journal/${post.slug}`}
            className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] transition-opacity hover:opacity-70"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  )
}
