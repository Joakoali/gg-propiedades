const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.80;
const CONCURRENT_UPLOADS = 3;

async function compressImage(file: File): Promise<File> {
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

  const name = file.name.replace(/\.[^.]+$/, ".jpg");
  return new File([blob], name, { type: "image/jpeg" });
}

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

export async function uploadWithPresignedUrls(
  files: File[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  // Obtener URLs firmadas del Worker
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

  // Subir cada archivo directo a R2
  const allUrls: string[] = [];
  const allErrors: string[] = [];
  let uploaded = 0;

  // Concurrencia controlada
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

    // Esperar cuando se alcanza el límite
    if (executing.length >= CONCURRENT_UPLOADS) {
      await Promise.race(executing);
      // Remover promesas resueltas
      for (let i = executing.length - 1; i >= 0; i--) {
        const settled = await Promise.race([
          executing[i].then(() => true),
          Promise.resolve(false),
        ]);
        if (settled) executing.splice(i, 1);
      }
    }
  }

  // Esperar uploads restantes
  await Promise.all(executing);

  return { urls: allUrls, errors: allErrors };
}
