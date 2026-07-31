import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Real file storage for course handouts.
 *
 * Connected to Supabase, bytes go to a private Storage bucket and downloads use
 * a short-lived signed URL, so a handout is not a permanently guessable public
 * link. In demo mode there is no server to hold bytes, so the file is kept as a
 * blob for the life of the tab — enough to upload something and open it back,
 * and it disappears on reload like the rest of the demo data.
 */

export const BUCKET = 'course-files';

/** Big enough for a scanned packet, small enough that one upload can't fill the bucket. */
export const MAX_UPLOAD_MB = 20;

/** Blobs held for the current tab only, keyed by storage path (demo mode). */
const demoBlobs = new Map<string, Blob>();
/** Object URLs handed out so far, so repeat downloads don't leak a new one each time. */
const demoUrls = new Map<string, string>();

/**
 * Turn a filename into something safe to use as a storage key: Storage paths
 * choke on spaces and non-ASCII, and two teachers uploading "notes.pdf" must
 * not overwrite each other.
 */
export function storagePathFor(classId: string, fileName: string): string {
  const safe = fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+/, '')
    .slice(-80) || 'file';
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  return `${classId}/${id}-${safe}`;
}

export function sizeInKb(bytes: number): number {
  return Math.max(1, Math.round(bytes / 1024));
}

/** Human-readable size for the files table. */
export function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

/** Rejects the upload with a readable reason, or returns null when it's fine. */
export function uploadProblem(file: File): string | null {
  if (file.size === 0) return "That file is empty — nothing to upload.";
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}

/** Store the bytes and return the path to record on the files row. */
export async function uploadFile(classId: string, file: File): Promise<string> {
  const path = storagePathFor(classId, file.name);
  if (!isSupabaseConfigured) {
    demoBlobs.set(path, file);
    return path;
  }
  const { error } = await supabase!.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return path;
}

/**
 * A URL the browser can open. Signed URLs expire, so this is resolved at click
 * time rather than stored alongside the row.
 */
export async function downloadUrl(path: string): Promise<string | null> {
  if (!isSupabaseConfigured) {
    const existing = demoUrls.get(path);
    if (existing) return existing;
    const blob = demoBlobs.get(path);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    demoUrls.set(path, url);
    return url;
  }
  const { data, error } = await supabase!.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

/** True when the file's bytes are actually reachable (seeded demo rows have none). */
export function isDownloadable(path: string | null): path is string {
  if (!path) return false;
  return isSupabaseConfigured || demoBlobs.has(path);
}

/**
 * Delete the bytes. Called before the row goes, so a failure here leaves a row
 * pointing at a real file rather than an orphaned object nobody can reach.
 */
export async function removeStoredFile(path: string | null): Promise<void> {
  if (!path) return;
  if (!isSupabaseConfigured) {
    const url = demoUrls.get(path);
    if (url) URL.revokeObjectURL(url);
    demoUrls.delete(path);
    demoBlobs.delete(path);
    return;
  }
  const { error } = await supabase!.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
