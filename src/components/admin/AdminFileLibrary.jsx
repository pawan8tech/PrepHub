import { useState, useEffect, useRef } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { uploadResourceToCloudinary, cloudinaryConfigured } from '../../utils/cloudinary';
import { useAuth } from '../../context/AuthContext';

function formatBytes(n) {
  if (!n || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let x = n;
  let i = 0;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i += 1;
  }
  return `${x.toFixed(x < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d ? d.toLocaleDateString() : '';
  } catch {
    return '';
  }
}

export default function AdminFileLibrary() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'admin_files'), orderBy('createdAt', 'desc')));
      setFiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (!cloudinaryConfigured()) {
      setError('Cloudinary is not configured. Set the env vars.');
      return;
    }
    setUploading(true);
    try {
      const up = await uploadResourceToCloudinary(file);
      await addDoc(collection(db, 'admin_files'), {
        name: file.name,
        url: up.url,
        publicId: up.publicId,
        resourceType: up.resourceType,
        bytes: up.bytes || file.size || 0,
        format: up.format || (file.name.split('.').pop() || '').toLowerCase(),
        uploadedBy: user?.email || user?.uid || '',
        createdAt: serverTimestamp(),
      });
      await load();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.name}"? This removes it from the library and Cloudinary.`)) return;
    try {
      await deleteDoc(doc(db, 'admin_files', f.id));
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      fetch('/api/cloudinary-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: f.publicId, resourceType: f.resourceType }),
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const copy = (f) => {
    navigator.clipboard?.writeText(f.url).then(
      () => {
        setCopiedId(f.id);
        setTimeout(() => setCopiedId(''), 1500);
      },
      () => {},
    );
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-800">
        <div>
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Resource library</h2>
          <p className="text-xs text-surface-400 dark:text-surface-500">
            Upload PDFs / files (admin only) — stored on Cloudinary with copyable links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0-12l-4 4m4-4l4 4" />
          </svg>
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {error ? <p className="px-4 pt-3 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      {files.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-surface-400 dark:text-surface-500">
          No files uploaded yet.
        </p>
      ) : (
        <ul className="divide-y divide-surface-100 dark:divide-surface-800">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-100 text-[10px] font-semibold uppercase text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                {(f.format || 'file').slice(0, 4)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-800 dark:text-surface-200" title={f.name}>
                  {f.name}
                </p>
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                  {[formatBytes(f.bytes), formatDate(f.createdAt), f.uploadedBy].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copy(f)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
              >
                {copiedId === f.id ? 'Copied!' : 'Copy link'}
              </button>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                Open
              </a>
              <button
                type="button"
                onClick={() => remove(f)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
