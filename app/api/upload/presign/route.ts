import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { generatePresignedPutUrl } from "@/app/lib/r2";

const MAX_FILES = 30;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

interface FileRequest {
  name: string;
  type: string;
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const files: FileRequest[] = body.files;

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FILES} archivos por solicitud.` },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    files.map(async (file) => {
      const type = ALLOWED_TYPES.includes(file.type) ? file.type : "image/jpeg";
      const ext =
        type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { presignedUrl, publicUrl } = await generatePresignedPutUrl(key, type);

      return { presignedUrl, publicUrl, contentType: type };
    }),
  );

  return NextResponse.json({ files: results });
}
