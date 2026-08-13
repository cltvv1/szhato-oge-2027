import { NextResponse } from "next/server";
import { getAudioExercises } from "@/lib/audio-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const exercises = await getAudioExercises(false);
  return NextResponse.json({ exercises }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}

