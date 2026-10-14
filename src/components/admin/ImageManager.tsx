'use client';

import { useRef, useState } from 'react';
import { uploadFiles } from './api';
import { IconClose, IconPlus, IconStar, IconCheck } from '../icons';

export interface DraftImage {
  id?: number; // present when persisted in DB
  image_url: string;
  is_primary: boolean;
}

interface Props {
  images: DraftImage[];
  onChange: (next: DraftImage[]) => void;
  /** When editing an existing product, deletions hit the API immediately. */
  onDeletePersisted?: (imageId: number) => Promise<void>;
  onSetPrimaryPersisted?: (imageId: number) => Promise<void>;
}

/**
 * Universal photo management engine:
 *  - multi-file local upload (multipart → /api/upload)
 *  - external image URL ingestion
 *  - designate primary cover shot
 *  - remove (with disk + DB cleanup for persisted images)
 */
export default function ImageManager({
  images,
  onChange,
  onDeletePersisted,
  onSetPrimaryPersisted,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const ensurePrimary = (list: DraftImage[]): DraftImage[] => {
    if (list.length === 0) return list;
    if (!list.some((i) => i.is_primary)) {
      return list.map((i, idx) => ({ ...i, is_primary: idx === 0 }));
    }
    return list;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    const res = await uploadFiles(files);
    setUploading(false);
    if (!res.ok || !res.data) {
      setError(res.error || 'Upload failed');
      return;
    }
    const added = res.data.files.map((f) => ({
      image_url: f.url,
      is_primary: false,
    }));
    onChange(ensurePrimary([...images, ...added]));
    if (fileRef.current) fileRef.current.value = '';
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      setError('Enter a valid http(s) image URL');
      return;
    }
    setError('');
    onChange(ensurePrimary([...images, { image_url: url, is_primary: false }]));
    setUrlInput('');
  };

  const setPrimary = async (idx: number) => {
    const target = images[idx];
    onChange(images.map((img, i) => ({ ...img, is_primary: i === idx })));
    if (target.id && onSetPrimaryPersisted) {
      await onSetPrimaryPersisted(target.id);
    }
  };

  const remove = async (idx: number) => {
    const target = images[idx];
    if (target.id && onDeletePersisted) {
      await onDeletePersisted(target.id);
    }
    onChange(ensurePrimary(images.filter((_, i) => i !== idx)));
  };

  return (
    <div>
      <span className="label">Product Photos</span>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, idx) => (
          <div
            key={img.id ?? `${img.image_url}-${idx}`}
            className={`group relative aspect-square overflow-hidden border ${
              img.is_primary ? 'border-brand' : 'border-hairline'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.image_url}
              alt=""
              className="h-full w-full object-cover"
            />
            {img.is_primary && (
              <span className="absolute left-1 top-1 flex items-center gap-1 bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                <IconStar className="h-3 w-3" /> Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/40 opacity-0 transition group-hover:opacity-100">
              {!img.is_primary && (
                <button
                  type="button"
                  onClick={() => setPrimary(idx)}
                  title="Set as cover"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink hover:text-brand"
                >
                  <IconStar className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(idx)}
                title="Remove"
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-brand"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload tile */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 border border-dashed border-hairline text-muted transition hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <IconPlus className="h-5 w-5" />
          <span className="text-[10px] font-semibold uppercase">
            {uploading ? 'Uploading…' : 'Upload'}
          </span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* External URL ingestion */}
      <div className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="…or paste an external image URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" onClick={addUrl} className="btn-outline whitespace-nowrap px-4 py-2 text-xs">
          <IconCheck className="h-4 w-4" /> Add URL
        </button>
      </div>

      <p className="mt-1.5 text-[11px] text-muted">
        JPEG / PNG / WEBP · max 5MB each. The cover shot appears first on cards.
      </p>
      {error && <p className="mt-1 text-xs text-brand">{error}</p>}
    </div>
  );
}
