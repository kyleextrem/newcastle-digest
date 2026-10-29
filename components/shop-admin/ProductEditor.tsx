'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProductAction, saveProductAction } from '@/app/shop/admin/actions';
import { ProductImageFields, type ProductImageDraft } from '@/components/shop-admin/ProductImageFields';
import { isPersistedImageUrl } from '@/lib/shop-admin-images';
import type { ProductKind, ProductStatus } from '@/lib/shop-admin-policy';
import type { AdminProductView } from '@/lib/shop-admin-types';

type VariantForm = {
  id: string | null;
  name: string;
  sku: string;
  price: string;
  active: boolean;
  onHand: number;
  reserved: number;
  remove: boolean;
  removable: boolean;
};

const labelClass = 'font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]';
const inputClass =
  'mt-2 w-full rounded-2xl border border-[#251f18]/10 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] outline-none focus:border-[#849bff]';

export function ProductEditor({ product }: { product: AdminProductView | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(product?.id ?? null);
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [requiresShipping, setRequiresShipping] = useState(product?.requiresShipping ?? true);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'draft');
  const [kind, setKind] = useState<ProductKind>(product?.kind ?? 'simple');
  const [price, setPrice] = useState(product?.price ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [onHand, setOnHand] = useState(product?.stock?.onHand ?? 0);
  const [variants, setVariants] = useState<VariantForm[]>(
    product?.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      active: variant.active,
      onHand: variant.stock.onHand,
      reserved: variant.stock.reserved,
      remove: false,
      removable: variant.removable,
    })) ?? [],
  );
  const [images, setImages] = useState<ProductImageDraft[]>(
    product?.images.map((image) => ({
      key: image.id,
      id: image.id,
      url: image.url,
      alt: image.alt,
      variantId: image.variantId,
    })) ?? [],
  );

  const kindLocked = product?.kindLocked ?? false;
  const reserved = product?.stock?.reserved ?? 0;

  const uploading = images.some((image) => image.uploading);
  const savedVariants = variants.flatMap((variant) =>
    variant.id && !variant.remove ? [{ id: variant.id, name: variant.name }] : [],
  );

  const save = async () => {
    if (uploading) {
      setError('Wait for photos to finish uploading before saving.');
      return;
    }
    const readyImages = images.filter((image) => isPersistedImageUrl(image.url) && !image.uploading);
    if (images.length > 0 && readyImages.length !== images.length) {
      setError('Wait for photos to finish uploading before saving.');
      return;
    }
    setError('');
    setSaving(true);
    let nextId: string | null = null;
    try {
      const result = await saveProductAction({
        id: savedId,
        name,
        slug,
        description,
        requiresShipping,
        status,
        kind,
        price: kind === 'simple' ? price : '',
        sku: kind === 'simple' ? sku : '',
        onHand: kind === 'simple' ? onHand : null,
        variants:
          kind === 'variants'
            ? variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                price: variant.price,
                active: variant.active,
                onHand: variant.onHand,
                remove: variant.remove,
              }))
            : [],
        images: readyImages.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          variantId: kind === 'variants' ? image.variantId : null,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      nextId = result.id ?? savedId;
      if (result.id) {
        setSavedId(result.id);
      }
    } catch {
      setError('The product could not be saved. Your details are still here. Try again.');
    } finally {
      setSaving(false);
    }
    if (nextId && nextId !== product?.id) {
      router.replace(`/shop/admin/products/${nextId}`);
      return;
    }
    if (nextId) {
      router.refresh();
    }
  };

  const removeProduct = async () => {
    if (!savedId || !confirmDelete) {
      setError('Confirm deletion before removing this product.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const result = await deleteProductAction(savedId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace('/shop/admin');
    } catch {
      setError('The product could not be deleted. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-2xl bg-[#251f18] px-4 py-3 font-sans-main text-sm text-white" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-5 rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Link">
          <input
            className={inputClass}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Generated from the name if left blank"
          />
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-32`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-3 font-sans-main text-base text-[#251f18]">
          <input
            type="checkbox"
            checked={requiresShipping}
            onChange={(event) => setRequiresShipping(event.target.checked)}
          />
          This needs to be posted
        </label>
        <Field label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(parseStatus(event.target.value))}
          >
            <option value="draft">Draft</option>
            <option value="active">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <fieldset>
          <legend className={labelClass}>Product type</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <TypeButton
              selected={kind === 'simple'}
              disabled={kindLocked && kind !== 'simple'}
              onClick={() => {
                setKind('simple');
                setImages((current) => current.map((image) => ({ ...image, variantId: null })));
              }}
            >
              Simple
            </TypeButton>
            <TypeButton
              selected={kind === 'variants'}
              disabled={kindLocked && kind !== 'variants'}
              onClick={() => setKind('variants')}
            >
              Options
            </TypeButton>
          </div>
        </fieldset>
      </section>

      {kind === 'simple' ? (
        <section className="space-y-5 rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Price and stock</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price (AUD)">
              <input className={inputClass} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
            </Field>
            <Field label="SKU">
              <input className={inputClass} value={sku} onChange={(event) => setSku(event.target.value)} />
            </Field>
          </div>
          <StockFields onHand={onHand} reserved={reserved} onChange={setOnHand} />
        </section>
      ) : (
        <section className="space-y-5 rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Options</h2>
            <button
              type="button"
              className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff]"
              onClick={() =>
                setVariants((current) => [
                  ...current,
                  {
                    id: null,
                    name: '',
                    sku: '',
                    price: '',
                    active: true,
                    onHand: 0,
                    reserved: 0,
                    remove: false,
                    removable: true,
                  },
                ])
              }
            >
              Add option
            </button>
          </div>
          {variants.length === 0 ? (
            <p className="font-sans-main text-[#251f18]/60">Add an option such as a size or colour.</p>
          ) : null}
          <div className="space-y-6">
            {variants.map((variant, index) =>
              variant.remove ? null : (
                <div key={variant.id ?? `new-${index}`} className="space-y-4 border-t border-[#251f18]/10 pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Option">
                      <input
                        className={inputClass}
                        value={variant.name}
                        onChange={(event) => updateVariant(setVariants, index, { name: event.target.value })}
                      />
                    </Field>
                    <Field label="SKU">
                      <input
                        className={inputClass}
                        value={variant.sku}
                        onChange={(event) => updateVariant(setVariants, index, { sku: event.target.value })}
                      />
                    </Field>
                    <Field label="Price (AUD)">
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={variant.price}
                        onChange={(event) => updateVariant(setVariants, index, { price: event.target.value })}
                      />
                    </Field>
                    <label className="mt-7 flex items-center gap-3 font-sans-main text-base">
                      <input
                        type="checkbox"
                        checked={variant.active}
                        onChange={(event) => updateVariant(setVariants, index, { active: event.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                  <StockFields
                    onHand={variant.onHand}
                    reserved={variant.reserved}
                    onChange={(value) => updateVariant(setVariants, index, { onHand: value })}
                  />
                  {variant.removable ? (
                    <button
                      type="button"
                      className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45"
                      onClick={() => {
                        if (variant.id) {
                          updateVariant(setVariants, index, { remove: true });
                          setImages((current) => current.filter((image) => image.variantId !== variant.id));
                          return;
                        }
                        setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index));
                      }}
                    >
                      Remove option
                    </button>
                  ) : (
                    <p className="font-sans-main text-sm text-[#251f18]/60">
                      This option has stock history or orders. Turn it off instead of removing it.
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <ProductImageFields
        images={images}
        onChange={setImages}
        kind={kind}
        variants={savedVariants}
        disabled={saving}
      />

      {product && product.movements.length > 0 ? (
        <section className="rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Stock history</h2>
          <ul className="mt-4 space-y-3">
            {product.movements.map((movement) => (
              <li key={movement.id} className="font-sans-main text-sm text-[#251f18]/75">
                <span className="font-black text-[#251f18]">{movementLabel(movement.type)}</span>
                {movement.variantName ? ` · ${movement.variantName}` : ''} · on hand {signed(movement.onHandDelta)} to{' '}
                {movement.onHandAfter}, reserved {movement.reservedAfter}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div>
          <button type="button" className="rounded-full bg-[#849bff] px-8 py-3.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#6a7be6] disabled:opacity-50" disabled={saving || uploading} onClick={() => void save()}>
            {saving ? 'Saving' : 'Save'}
          </button>
          {saving ? (
            <p className="mt-3 font-sans-main text-sm text-[#251f18]/60" aria-live="polite">
              Saving the product. Photos are already stored.
            </p>
          ) : null}
        </div>
        {product?.status === 'active' ? (
          <a
            href={`/shop/${product.slug}`}
            className="rounded-full border border-[#251f18] px-8 py-3.5 font-sans-main text-[10px] font-black uppercase tracking-[0.2em]"
          >
            View on shop
          </a>
        ) : null}
      </div>

      {product?.canDelete ? (
        <section className="rounded-[24px] border border-[#251f18]/10 p-5">
          <h2 className="font-sans-main text-xl font-black uppercase tracking-tighter">Delete</h2>
          <p className="mt-2 font-sans-main text-sm text-[#251f18]/60">
            This is only available before the product has stock history or orders.
          </p>
          <label className="mt-4 flex items-center gap-3 font-sans-main text-sm">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(event) => setConfirmDelete(event.target.checked)}
            />
            I want to delete this product
          </label>
          <button
            type="button"
            className="mt-4 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/50"
            disabled={saving || !confirmDelete}
            onClick={() => void removeProduct()}
          >
            Delete product
          </button>
        </section>
      ) : product ? (
        <p className="font-sans-main text-sm text-[#251f18]/60">
          This product cannot be deleted because it has stock history or orders. Archive it instead.
        </p>
      ) : null}
    </div>
  );
}

function StockFields({
  onHand,
  reserved,
  onChange,
}: {
  onHand: number;
  reserved: number;
  onChange: (value: number) => void;
}) {
  const available = Math.max(0, onHand - reserved);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="On hand">
        <input
          className={inputClass}
          type="number"
          min={0}
          step={1}
          value={onHand}
          onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
        />
      </Field>
      <Readout label="Reserved" value={String(reserved)} />
      <Readout label="Available" value={String(available)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="mt-2 font-sans-main text-2xl font-black">{value}</p>
    </div>
  );
}

function TypeButton({
  children,
  selected,
  disabled,
  onClick,
}: {
  children: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 font-sans-main text-sm disabled:opacity-40 ${
        selected ? 'bg-[#849bff] text-white' : 'bg-[#faf9f6] text-[#251f18]'
      }`}
    >
      {children}
    </button>
  );
}

function updateVariant(
  setVariants: React.Dispatch<React.SetStateAction<VariantForm[]>>,
  index: number,
  patch: Partial<VariantForm>,
) {
  setVariants((current) => current.map((variant, itemIndex) => (itemIndex === index ? { ...variant, ...patch } : variant)));
}

function parseStatus(value: string): ProductStatus {
  switch (value) {
    case 'draft':
    case 'active':
    case 'archived':
      return value;
    default:
      return 'draft';
  }
}

function movementLabel(type: string): string {
  switch (type) {
    case 'restock':
      return 'Opening stock';
    case 'adjustment':
      return 'Adjustment';
    case 'reserve':
      return 'Reserved';
    case 'release':
      return 'Released';
    case 'sale':
      return 'Sold';
    case 'return':
      return 'Return';
    case 'reship':
      return 'Replacement';
    default:
      return 'Stock change';
  }
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
