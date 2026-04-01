/**
 * Client-side image compression using Canvas API.
 * No external dependencies needed.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.80;

/**
 * Compress an image file client-side before uploading.
 * - Resizes to max 1920px on the longest side
 * - Converts to JPEG at 80% quality
 * - Returns a new File object ready for FormData
 */
export async function compressImage(file: File): Promise<File> {
  // If already small enough (< 500KB), skip compression
  if (file.size < 500 * 1024) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let newWidth = width;
  let newHeight = height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      newWidth = MAX_DIMENSION;
      newHeight = Math.round((height / width) * MAX_DIMENSION);
    } else {
      newHeight = MAX_DIMENSION;
      newWidth = Math.round((width / height) * MAX_DIMENSION);
    }
  }

  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: JPEG_QUALITY,
  });

  // Preserve original name but change extension
  const name = file.name.replace(/\.[^.]+$/, ".jpg");
  return new File([blob], name, { type: "image/jpeg" });
}

/**
 * Compress multiple images, with progress callback.
 */
export async function compressImages(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<File[]> {
  const results: File[] = [];
  for (let i = 0; i < files.length; i++) {
    results.push(await compressImage(files[i]));
    onProgress?.(i + 1, files.length);
  }
  return results;
}

/**
 * Upload files in batches, returning all URLs.
 * Sends BATCH_SIZE files per request to avoid Worker resource limits.
 */
const BATCH_SIZE = 5;

export async function uploadInBatches(
  files: File[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  const allUrls: string[] = [];
  const allErrors: string[] = [];
  let uploaded = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const fd = new FormData();
    batch.forEach((file) => fd.append("images", file));

    const res = await fetch("/api/upload", { method: "POST", body: fd });

    if (!res.ok) {
      const text = await res.text().catch(() => "Error de red");
      allErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${text}`);
      continue;
    }

    const data = await res.json();
    if (data.urls) allUrls.push(...data.urls);
    if (data.errors) allErrors.push(...data.errors);

    uploaded += batch.length;
    onProgress?.(uploaded, files.length);
  }

  return { urls: allUrls, errors: allErrors };
}
