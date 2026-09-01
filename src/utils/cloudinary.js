const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'note-images';

export function cloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export function isCloudinaryUrl(url) {
  return typeof url === 'string' && /res\.cloudinary\.com/i.test(url);
}

/**
 * Unsigned Cloudinary upload. `fileOrUrl` may be a File/Blob (direct upload) or a
 * string URL (Cloudinary fetches it server-side — used to re-host pasted images).
 * Returns the permanent secure_url.
 */
async function upload(fileOrUrl) {
  if (!cloudinaryConfigured()) throw new Error('Cloudinary is not configured.');
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append('file', fileOrUrl);
  form.append('upload_preset', UPLOAD_PRESET);
  if (UPLOAD_FOLDER) form.append('folder', UPLOAD_FOLDER);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(endpoint, { method: 'POST', body: form, signal: controller.signal });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error?.message) message = body.error.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    const data = await res.json();
    return data.secure_url;
  } finally {
    clearTimeout(timer);
  }
}

export function uploadFileToCloudinary(file) {
  return upload(file);
}

/**
 * Upload any file type (PDF, docs, zips, images…) via Cloudinary's `auto` endpoint,
 * into a `resources` subfolder. Returns metadata used by the admin resource library.
 */
export async function uploadResourceToCloudinary(file) {
  if (!cloudinaryConfigured()) throw new Error('Cloudinary is not configured.');
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('folder', `${UPLOAD_FOLDER}/resources`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(endpoint, { method: 'POST', body: form, signal: controller.signal });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.error?.message) message = body.error.message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    const data = await res.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type || 'image',
      bytes: data.bytes || 0,
      format: data.format || '',
      originalFilename: data.original_filename || '',
    };
  } finally {
    clearTimeout(timer);
  }
}

export function uploadRemoteImageToCloudinary(url) {
  return upload(url);
}

/** Extract the Cloudinary public_id (incl. folder) from a secure_url, or null. */
export function cloudinaryPublicId(url) {
  if (typeof url !== 'string' || !url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!u.hostname.includes('res.cloudinary.com')) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  const uploadIdx = parts.indexOf('upload');
  if (uploadIdx === -1) return null;
  const rest = parts
    .slice(uploadIdx + 1)
    .filter((seg) => !/^v\d+$/.test(seg) && !seg.includes(','));
  if (rest.length === 0) return null;
  rest[rest.length - 1] = rest[rest.length - 1].replace(/\.[^./]+$/, '');
  return rest.map(decodeURIComponent).join('/');
}
