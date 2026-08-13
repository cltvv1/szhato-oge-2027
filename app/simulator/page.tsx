import { getAudioExercises } from "@/lib/audio-store";
import { ExamSimulator } from "./ExamSimulator";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const records = await getAudioExercises(false, "exam");
  const variants = records.map(({ id, title, description, difficulty, durationSeconds, audioUrl }) => ({ id, title, description, difficulty, durationSeconds, audioUrl }));
  return <ExamSimulator variants={variants} />;
}
