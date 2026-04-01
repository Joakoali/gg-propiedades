import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { uploadToR2 } from "@/app/lib/r2";

const MAX_SIZE_MB = 10;
const MAX_FILES = 20;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function isValidImage(buf: Buffer): boolean {
  if (buf.length < 4) return false;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;

  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return true;
  }

  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf.length >= 12 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true;
  }

  return false;
}

function logUploadEvent(
  stage: string,
  details: Record<string, string | number | boolean | null | undefined>,
) {
  console.info("[upload]", JSON.stringify({ stage, ...details }));
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  const session = await getServerSession(authOptions);
  if (!session) {
    logUploadEvent("unauthorized", { durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    logUploadEvent("storage_unavailable", {
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: "Servicio de storage no disponible." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    logUploadEvent("empty_request", { durationMs: Date.now() - startedAt });
    return NextResponse.json({ urls: [] });
  }

  if (files.length > MAX_FILES) {
    logUploadEvent("too_many_files", {
      count: files.length,
      maxFiles: MAX_FILES,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: `Maximo ${MAX_FILES} archivos por solicitud.` },
      { status: 400 },
    );
  }

  const urls: string[] = [];
  const errors: string[] = [];

  logUploadEvent("request_started", {
    count: files.length,
    durationMs: Date.now() - startedAt,
  });

  for (const file of files) {
    const fileStartedAt = Date.now();

    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: tipo no permitido`);
      logUploadEvent("file_rejected_type", {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        durationMs: Date.now() - fileStartedAt,
      });
      continue;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      errors.push(`${file.name}: supera ${MAX_SIZE_MB}MB`);
      logUploadEvent("file_rejected_size", {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        maxSizeMb: MAX_SIZE_MB,
        durationMs: Date.now() - fileStartedAt,
      });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isValidImage(buffer)) {
      errors.push(`${file.name}: contenido no es una imagen valida`);
      logUploadEvent("file_rejected_magic_bytes", {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        durationMs: Date.now() - fileStartedAt,
      });
      continue;
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const publicUrl = await uploadToR2(key, buffer, file.type);
      urls.push(publicUrl);
      logUploadEvent("file_uploaded", {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        key,
        durationMs: Date.now() - fileStartedAt,
      });
    } catch (error) {
      errors.push(`${file.name}: error al subir`);
      console.error("R2 upload error:", error);
      logUploadEvent("file_upload_failed", {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        key,
        error:
          error instanceof Error
            ? error.message.slice(0, 300)
            : "unknown_upload_error",
        durationMs: Date.now() - fileStartedAt,
      });
    }
  }

  logUploadEvent("request_completed", {
    uploadedCount: urls.length,
    errorCount: errors.length,
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json({
    urls,
    errors: errors.length > 0 ? errors : undefined,
  });
}
