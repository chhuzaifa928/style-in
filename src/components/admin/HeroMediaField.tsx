'use client';

import { useRef, useState } from 'react';
import { isVideoUrl } from '@/lib/format';
import { IconPlus, IconClose, IconCheck } from '../icons';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Hero background picker: upload an image or video (→ /api/upload?allow=media),
 * or paste an external URL. Shows a live preview and a clear button.
 */
export default function HeroMediaField({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const upload = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', files[0]);
      const res = await fetch('/api/upload?allow=media', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok || !json.ok) {
        setError(json.error || 'Upload failed');
        return;
      }
      onChange(json.data.files[0].url);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      setError('Enter a valid http(s) URL');
      return;
    }
    setError('');
    onChange(url);
    setUrlInput('');
  };

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden border border-hairline bg-[#F1F0EC]">
        {value ? (
          isVideoUrl(value) ? (
            <video
              src={value}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No hero media — gradient fallback shown on the store
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            title="Clear"
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-brand shadow"
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-outline px-3 py-2 text-xs"
        >
          <IconPlus className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload image / video'}
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="input"
          placeholder="…or paste an image/video URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" onClick={addUrl} className="btn-outline whitespace-nowrap px-3 py-2 text-xs">
          <IconCheck className="h-4 w-4" /> Set
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <p className="mt-1.5 text-[11px] text-muted">
        Image (JPEG/PNG/WEBP, ≤5MB) or video (MP4/WEBM, ≤50MB). Video autoplays
        muted & looping.
      </p>
      {error && <p className="mt-1 text-xs text-brand">{error}</p>}
    </div>
  );
}
