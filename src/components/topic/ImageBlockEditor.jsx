import { useState, useRef } from 'react';
import {
  uploadFileToCloudinary,
  cloudinaryConfigured,
  cloudinaryPublicId,
} from '../../utils/cloudinary';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Best-effort delete of a previously-uploaded Cloudinary asset (server-signed). */
export function deleteRemoteImage(url) {
  const publicId = cloudinaryPublicId(url);
  if (!publicId) return;
  fetch('/api/cloudinary-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  }).catch(() => {
    /* orphaned asset cleanup is best-effort; never block the UI */
  });
}

/**
 * Editable image block: upload a file to Cloudinary (stores the returned secure
 * URL on the block) or paste an image URL directly. `onChange` receives a patch
 * like `{ url }` or `{ caption }`.
 */
export default function ImageBlockEditor({ url, caption, onChange, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 10 MB.');
      return;
    }
    if (!cloudinaryConfigured()) {
      setError('Image upload is not configured. Set the Cloudinary env vars.');
      return;
    }
    const previousUrl = url;
    setUploading(true);
    try {
      const secureUrl = await uploadFileToCloudinary(file);
      onChange({ url: secureUrl });
      // Replacing an existing upload — clean up the orphaned old asset.
      if (previousUrl && previousUrl !== secureUrl) deleteRemoteImage(previousUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <figure className="group/block relative rounded-lg border border-surface-200 bg-surface-50/40 p-3 dark:border-surface-700 dark:bg-surface-900/40">
      <button
        type="button"
        onClick={() => {
          deleteRemoteImage(url);
          onRemove();
        }}
        aria-label="Remove image"
        title="Remove image"
        className="absolute right-2 top-2 z-10 hidden h-7 items-center gap-1 rounded-md bg-white px-2 text-xs text-surface-700 shadow-sm ring-1 ring-surface-200 hover:text-red-600 group-hover/block:inline-flex dark:bg-surface-800 dark:text-surface-200 dark:ring-surface-700 dark:hover:text-red-400"
      >
        × Remove
      </button>

      {url ? (
        <img
          src={url}
          alt={caption || ''}
          className="max-h-[min(24rem,60vh)] w-auto rounded-md object-contain"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-surface-300 text-xs text-surface-400 transition-colors hover:border-primary-300 hover:text-primary-500 disabled:opacity-50 dark:border-surface-600 dark:text-surface-500 dark:hover:border-primary-700"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0-12l-4 4m4-4l4 4" />
          </svg>
          {uploading ? 'Uploading…' : 'Click to upload an image'}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className={url ? 'hidden group-hover/block:block' : ''}>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary-300 bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0-12l-4 4m4-4l4 4" />
          </svg>
          {uploading ? 'Uploading…' : url ? 'Replace' : 'Upload image'}
        </button>
        {url ? (
          <button
            type="button"
            onClick={() => {
              deleteRemoteImage(url);
              onChange({ url: '' });
            }}
            disabled={uploading}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:text-red-600 disabled:opacity-50 dark:text-surface-400 dark:hover:text-red-400"
          >
            Clear
          </button>
        ) : null}
      </div>

      <input
        type="url"
        value={url}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="…or paste an image URL (https://…)"
        className="mt-2 w-full rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-xs text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
        aria-label="Image URL"
      />
      <input
        type="text"
        value={caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (optional)"
        className="mt-2 w-full rounded-md border border-surface-200 bg-white px-2.5 py-1.5 text-xs text-surface-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
        aria-label="Image caption"
      />
      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    </figure>
  );
}