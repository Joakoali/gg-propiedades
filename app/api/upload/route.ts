import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { uploadToR2 } from "@/app/lib/r2";

const MAX_SIZE_MB = 10;
const MAX_FILES = 20;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/** Validate actual file content by checking magic bytes (not just MIME which is client-spoofable) */
function isValidImage(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return true;
  // WEBP: RIFF....WEBP
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
  )
    return true;
  return false;
}

export async function POST(request: Request) {
  // 1. Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return NextResponse.json(
      { error: "Servicio de storage no disponible." },
      { status: 503 },
    );
  }

  // 2. Parsear form data
  const formData = await request.formData();
  const files = formData.getAll("images") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FILES} archivos por solicitud.` },
      { status: 400 },
    );
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // 3. Validar tipo MIME (primera barrera)
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: tipo no permitido`);
      continue;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      errors.push(`${file.name}: supera ${MAX_SIZE_MB}MB`);
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Validar magic bytes (segunda barrera — verifica contenido real)
    if (!isValidImage(buffer)) {
      errors.push(`${file.name}: contenido no es una imagen válida`);
      continue;
    }

    // 5. Nombre único (sin preservar el original — evita path traversal)
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // 6. Subir a Cloudflare R2
    try {
      const publicUrl = await uploadToR2(key, buffer, file.type);
      urls.push(publicUrl);
    } catch (e) {
      errors.push(`${file.name}: error al subir`);
      console.error("R2 upload error:", e);
    }
  }

  return NextResponse.json({
    urls,
    errors: errors.length > 0 ? errors : undefined,
  });
}
