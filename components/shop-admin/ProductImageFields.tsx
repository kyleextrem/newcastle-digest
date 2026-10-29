'use client';

import { useId, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  SHOP_IMAGE_UPLOAD_CONCURRENCY,
  SHOP_IMAGE_UPLOAD_TIMEOUT_MS,
  isPersistedImageUrl,
  runWithLimit,
} from '@/lib/shop-admin-images';
import { MAX_PRODUCT_IMAGES, type ProductKind } from '@/lib/shop-admin-policy';

export type ProductImageDraft = {
  key: string;
  id: string | null;
  url: string;
  alt: string;
  variantId: string | null;
  uploading?: boolean;
};

type SavedVariant = {
  id: string;
  name: string;
};

const labelClass = 'font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#849bff]';
const inputClass =
  'mt-2 w-full rounded-2xl border border-[#251f18]/10 bg-white px-4 py-3 font-sans-main text-base text-[#251f18] outline-none focus:border-[#849bff]';

export function ProductImageFields({
  images,
  onChange,
  kind,
  variants,
  disabled,
}: {
  images: ProductImageDraft[];
  onChange: Dispatch<SetStateAction<ProductImageDraft[]>>;
  kind: ProductKind;
  variants: SavedVariant[];
  disabled: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const remaining = MAX_PRODUCT_IMAGES - images.length;
  const uploadingCount = images.filter((image) => image.uploading).length;

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }
    if (remaining <= 0) {
      setError(`A product can have at most ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
    const accepted = files.slice(0, remaining);
    setError(files.length > remaining ? `Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added.` : '');
    void uploadFiles(accepted, remaining, onChange, setError, setProgress);
  };

  return (
    <section className="space-y-5 rounded-[24px] bg-white p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-sans-main text-2xl font-black uppercase tracking-tighter">Images</h2>
          <p className="mt-2 font-sans-main text-sm text-[#251f18]/60">
            Upload JPEG, PNG, WebP, or GIF photos up to 3.5 MB. They are stored in the existing Sanity project.
          </p>
        </div>
        <button
          type="button"
          className="font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] disabled:opacity-40"
          disabled={disabled || remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          Add photos
        </button>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files) {
            addFiles(event.target.files);
          }
          event.target.value = '';
        }}
      />

      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-4 py-8 text-center ${
          dragging ? 'border-[#849bff] bg-[#849bff]/10' : 'border-[#251f18]/15 bg-[#faf9f6]'
        }`}
      >
        <span className="font-sans-main text-base text-[#251f18]">
          Drop photos here, or choose files from your computer.
        </span>
        <span className="mt-2 font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45">
          {images.length} of {MAX_PRODUCT_IMAGES}
        </span>
      </label>

      {error ? (
        <p className="rounded-2xl bg-[#251f18] px-4 py-3 font-sans-main text-sm text-white" role="alert">
          {error}
        </p>
      ) : null}

      {kind === 'variants' && variants.length === 0 ? (
        <p className="font-sans-main text-sm text-[#251f18]/60">
          Photos belong to the whole product until an option is saved. After saving, you can attach photos to a
          specific option.
        </p>
      ) : null}

      {progress ? (
        <p className="font-sans-main text-sm text-[#251f18]/60" aria-live="polite">
          Uploading photos {progress.completed} of {progress.total}. The product has not been saved yet.
        </p>
      ) : uploadingCount > 0 ? (
        <p className="font-sans-main text-sm text-[#251f18]/60" aria-live="polite">
          Uploading photos. The product has not been saved yet.
        </p>
      ) : null}

      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => reorder(event, onChange)}
        >
          <SortableContext items={images.map((image) => image.key)} strategy={rectSortingStrategy}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {images.map((image, index) => (
                <SortableImageCard
                  key={image.key}
                  image={image}
                  index={index}
                  last={index === images.length - 1}
                  kind={kind}
                  variants={variants}
                  disabled={disabled || Boolean(image.uploading)}
                  onPatch={(patch) =>
                    onChange((current) =>
                      current.map((item) => (item.key === image.key ? { ...item, ...patch } : item)),
                    )
                  }
                  onMove={(direction) =>
                    onChange((current) => moveImage(current, image.key, direction))
                  }
                  onRemove={() => onChange((current) => current.filter((item) => item.key !== image.key))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}
    </section>
  );
}

function SortableImageCard({
  image,
  index,
  last,
  kind,
  variants,
  disabled,
  onPatch,
  onMove,
  onRemove,
}: {
  image: ProductImageDraft;
  index: number;
  last: boolean;
  kind: ProductKind;
  variants: SavedVariant[];
  disabled: boolean;
  onPatch: (patch: Partial<ProductImageDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.key,
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`overflow-hidden rounded-[24px] border border-[#251f18]/10 bg-[#faf9f6] ${
        isDragging ? 'z-10 ring-2 ring-[#849bff]/40' : ''
      }`}
    >
      <div className="relative aspect-square bg-[#251f18]/5">
        {image.url ? (
          // Existing URLs may not be on the Sanity CDN, so the unoptimized img tag is required.
          <img src={image.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-sans-main text-sm text-[#251f18]/45">
            No preview
          </div>
        )}
        {image.uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#faf9f6]/80 font-sans-main text-sm">
            Uploading
          </div>
        ) : null}
        <button
          type="button"
          className="absolute left-3 top-3 rounded-full bg-white/90 p-2 text-[#251f18]/50"
          aria-label={`Reorder image ${index + 1}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <label className="block">
          <span className={labelClass}>Description</span>
          <input
            className={inputClass}
            value={image.alt}
            disabled={disabled}
            onChange={(event) => onPatch({ alt: event.target.value })}
          />
        </label>
        {kind === 'variants' ? (
          <label className="block">
            <span className={labelClass}>Shown on</span>
            <select
              className={inputClass}
              value={image.variantId ?? ''}
              disabled={disabled || variants.length === 0}
              onChange={(event) => onPatch({ variantId: event.target.value || null })}
            >
              <option value="">All options</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name || 'Untitled option'}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45 disabled:opacity-30"
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
          >
            Earlier
          </button>
          <button
            type="button"
            className="font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45 disabled:opacity-30"
            disabled={disabled || last}
            onClick={() => onMove(1)}
          >
            Later
          </button>
          <button
            type="button"
            className="ml-auto font-mono-main text-[10px] uppercase tracking-widest text-[#251f18]/45"
            disabled={disabled}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function reorder(event: DragEndEvent, onChange: Dispatch<SetStateAction<ProductImageDraft[]>>) {
  const { active, over } = event;
  if (!over || active.id === over.id) {
    return;
  }
  onChange((images) => {
    const oldIndex = images.findIndex((image) => image.key === active.id);
    const newIndex = images.findIndex((image) => image.key === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return images;
    }
    return arrayMove(images, oldIndex, newIndex);
  });
}

function moveImage(images: ProductImageDraft[], key: string, direction: -1 | 1): ProductImageDraft[] {
  const index = images.findIndex((image) => image.key === key);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= images.length) {
    return images;
  }
  return arrayMove(images, index, next);
}

async function uploadFiles(
  files: File[],
  remaining: number,
  onChange: Dispatch<SetStateAction<ProductImageDraft[]>>,
  setError: (message: string) => void,
  setProgress: Dispatch<SetStateAction<{ completed: number; total: number } | null>>,
) {
  const placeholders = files.slice(0, Math.max(0, remaining)).map((file) => ({
    key: crypto.randomUUID(),
    preview: URL.createObjectURL(file),
    alt: altFromFilename(file.name),
    file,
  }));
  if (placeholders.length === 0) {
    return;
  }

  onChange((current) => {
    const room = MAX_PRODUCT_IMAGES - current.length;
    return [
      ...current,
      ...placeholders.slice(0, Math.max(0, room)).map((item) => ({
        key: item.key,
        id: null,
        url: item.preview,
        alt: item.alt,
        variantId: null,
        uploading: true,
      })),
    ];
  });
  setProgress({ completed: 0, total: placeholders.length });

  const errors: string[] = [];
  try {
    await runWithLimit(placeholders, SHOP_IMAGE_UPLOAD_CONCURRENCY, async (placeholder) => {
      const result = await uploadShopImage(placeholder.file);
      URL.revokeObjectURL(placeholder.preview);
      setProgress((current) =>
        current ? { completed: current.completed + 1, total: current.total } : current,
      );
      if (!result.ok) {
        errors.push(result.error);
        onChange((current) => current.filter((item) => item.key !== placeholder.key));
        return;
      }
      onChange((current) =>
        current.map((item) =>
          item.key === placeholder.key ? { ...item, url: result.url, uploading: false } : item,
        ),
      );
    });
  } catch {
    errors.push('The image could not be uploaded. Try again.');
  } finally {
    onChange((current) =>
      current.flatMap((item) => {
        const placeholder = placeholders.find((entry) => entry.key === item.key);
        if (!placeholder || !item.uploading) {
          return [item];
        }
        URL.revokeObjectURL(placeholder.preview);
        return [];
      }),
    );
    setProgress(null);
    if (errors.length === 1) {
      setError(errors[0] ?? 'The image could not be uploaded. Try again.');
    } else if (errors.length > 1) {
      setError(`${errors.length} photos could not be uploaded. The others are ready to save.`);
    }
  }
}

async function uploadShopImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const body = new FormData();
  body.append('file', file);
  let response: Response;
  try {
    response = await fetch('/api/shop/admin/images', {
      method: 'POST',
      body,
      credentials: 'same-origin',
      signal: AbortSignal.timeout(SHOP_IMAGE_UPLOAD_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return { ok: false, error: 'That photo took too long to upload. Try again.' };
    }
    return { ok: false, error: 'The image could not be uploaded. Try again.' };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: 'The image could not be uploaded. Try again.' };
  }
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'The image could not be uploaded. Try again.' };
  }
  const record = payload as { ok?: unknown; url?: unknown; error?: unknown };
  if (response.status === 401) {
    return { ok: false, error: 'Sign in to upload shop images.' };
  }
  if (record.ok === true && typeof record.url === 'string' && isPersistedImageUrl(record.url)) {
    return { ok: true, url: record.url };
  }
  if (typeof record.error === 'string' && record.error) {
    return { ok: false, error: record.error };
  }
  return { ok: false, error: 'The image could not be uploaded. Try again.' };
}

function altFromFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? '';
  return base.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 300);
}
