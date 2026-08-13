import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
];

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        if (!(await isAdminAuthenticated())) throw new Error("Необходим вход администратора.");
        const payload = JSON.parse(clientPayload || "{}") as { contentType?: string; size?: number };
        if (!payload.contentType || !AUDIO_TYPES.includes(payload.contentType)) {
          throw new Error("Поддерживаются MP3, M4A, WAV, OGG и WebM.");
        }
        if (!payload.size || payload.size > 100 * 1024 * 1024) {
          throw new Error("Размер аудиофайла не должен превышать 100 МБ.");
        }
        return {
          allowedContentTypes: AUDIO_TYPES,
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploadedBy: "admin" }),
        };
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить аудио.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
