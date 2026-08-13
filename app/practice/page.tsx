import { getPracticeExercises } from "@/lib/practice-store";
import { getPracticeSections } from "@/lib/practice-section-store";
import { PracticeClient } from "./PracticeClient";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const [exercises, sections] = await Promise.all([getPracticeExercises(), getPracticeSections()]);
  const visibleSectionIds = new Set(sections.map((section) => section.id));
  return <PracticeClient exercises={exercises.filter((exercise) => visibleSectionIds.has(exercise.block))} sections={sections} />;
}
