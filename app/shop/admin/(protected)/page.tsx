import Link from 'next/link';
import { listAdminProducts } from '@/lib/shop-admin-products';
import type { ProductStatus } from '@/lib/shop-admin-policy';
import { requireShopAdmin } from '@/lib/shop-admin-session';
import type { AdminProductListItem } from '@/lib/shop-admin-types';

export const dynamic = 'force-dynamic';

type AdminPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS: Array<{ label: string; status: ProductStatus | null }> = [
  { label: 'All', status: null },
  { label: 'Drafts', status: 'draft' },
  { label: 'Published', status: 'active' },
  { label: 'Archived', status: 'archived' },
];

export default async function ShopAdminPage({ searchParams }: AdminPageProps) {
  await requireShopAdmin();
  const params = await searchParams;
  const status = parseFilter(params.status);
  const products = await listAdminProducts(status);

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono-main text-[10px] uppercase tracking-[0.25em] text-[#849bff]">
              Newcastle Digest
            </p>
            <h1 className="mt-2 font-sans-main text-5xl font-black uppercase tracking-tighter md:text-7xl">
              Shop admin
            </h1>
          </div>
          <Link
            href="/shop/admin/products/new"
            className="rounded-full bg-[#849bff] px-6 py-3 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#6a7be6]"
          >
            New product
          </Link>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((filter) => {
            const href = filter.status ? `/shop/admin?status=${filter.status}` : '/shop/admin';
            const selected = filter.status === status;
            return (
              <Link
                key={filter.label}
                href={href}
                className={`shrink-0 rounded-full px-4 py-2 font-mono-main text-[10px] uppercase tracking-widest ${
                  selected ? 'bg-[#849bff] text-white' : 'bg-white text-[#251f18]'
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {products.length === 0 ? (
          <div className="mt-6 rounded-[24px] bg-white px-6 py-16 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
            <h2 className="font-sans-main text-3xl font-black uppercase tracking-tighter">No products yet</h2>
            <p className="mt-3 font-sans-main text-[#251f18]/60">
              Create a draft, then publish it when the price and stock are ready.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductRow product={product} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ProductRow({ product }: { product: AdminProductListItem }) {
  return (
    <Link
      href={`/shop/admin/products/${product.id}`}
      className="block rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">{product.name}</h2>
        <span className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]">
          {statusLabel(product.status)}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <Stock label="On hand" value={product.onHand} />
        <Stock label="Reserved" value={product.reserved} />
        <Stock label="Available" value={product.available} />
      </dl>
    </Link>
  );
}

function Stock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/40">{label}</dt>
      <dd className="mt-1 font-sans-main text-xl font-black">{value}</dd>
    </div>
  );
}

function statusLabel(status: ProductStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'active':
      return 'Published';
    case 'archived':
      return 'Archived';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

function parseFilter(value: string | undefined): ProductStatus | null {
  switch (value) {
    case 'draft':
    case 'active':
    case 'archived':
      return value;
    default:
      return null;
  }
}
