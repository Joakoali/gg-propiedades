/**
 * Client-side image compression + direct-to-R2 upload via presigned URLs.
 * The Worker only generates lightweight signatures — file data never touches it.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.80;
const CONCURRENT_UPLOADS = 3;

/**
 * Compress an image file client-side before uploading.
 * - Resizes to max 1920px on the longest side
 * - Converts to JPEG at 80% quality
 * - Returns a new File object ready for upload
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

interface PresignedFile {
  presignedUrl: string;
  publicUrl: string;
  contentType: string;
}

/**
 * Upload files using presigned URLs — files go directly to R2,
 * bypassing the Worker entirely. Only the presign request hits the Worker.
 */
export async function uploadWithPresignedUrls(
  files: File[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  // Step 1: Get presigned URLs from the Worker (lightweight, no file data)
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: files.map((f) => ({ name: f.name, type: f.type })),
    }),
  });

  if (!presignRes.ok) {
    const text = await presignRes.text().catch(() => "Error de red");
    return { urls: [], errors: [text] };
  }

  const { files: presigned }: { files: PresignedFile[] } =
    await presignRes.json();

  // Step 2: Upload each file directly to R2 (bypasses Worker)
  const allUrls: string[] = [];
  const allErrors: string[] = [];
  let uploaded = 0;

  // Upload with controlled concurrency
  const queue = files.map((file, i) => ({ file, presigned: presigned[i] }));
  const executing: Promise<void>[] = [];

  for (const { file, presigned: p } of queue) {
    const task = (async () => {
      try {
        const res = await fetch(p.presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": p.contentType },
        });
        if (res.ok) {
          allUrls.push(p.publicUrl);
        } else {
          allErrors.push(`${file.name}: R2 error ${res.status}`);
        }
      } catch {
        allErrors.push(`${file.name}: error de red`);
      }
      uploaded++;
      onProgress?.(uploaded, files.length);
    })();

    executing.push(task);

    // Control concurrency: wait when we hit the limit
    if (executing.length >= CONCURRENT_UPLOADS) {
      await Promise.race(executing);
      // Remove resolved promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          executing[i].then(() => true),
          Promise.resolve(false),
        ]);
        if (settled) executing.splice(i, 1);
      }
    }
  }

  // Wait for remaining uploads
  await Promise.all(executing);

  return { urls: allUrls, errors: allErrors };
}
