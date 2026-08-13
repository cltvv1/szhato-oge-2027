import { NextResponse } from "next/server";
import { getPracticeExercises } from "@/lib/practice-store";
import { getPracticeSections } from "@/lib/practice-section-store";
import { getTheoryLessons } from "@/lib/theory-store";

export async function GET() {
  const [lessons, exercises, sections] = await Promise.all([getTheoryLessons(), getPracticeExercises(), getPracticeSections()]);
  const visibleSectionIds = new Set(sections.map((section) => section.id));
  const visibleExercises = exercises.filter((exercise) => visibleSectionIds.has(exercise.block));
  return NextResponse.json({ coreIds: [...lessons.map((lesson) => lesson.id), ...visibleExercises.map((exercise) => exercise.id)] });
}
