import { getPracticeExercises } from "@/lib/practice-store";
import { PracticeClient } from "./PracticeClient";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const exercises = await getPracticeExercises();
  return <PracticeClient exercises={exercises} />;
}
