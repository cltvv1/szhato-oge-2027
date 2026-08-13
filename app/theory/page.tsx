import { getTheoryLessons } from "@/lib/theory-store";
import { TheoryClient } from "./TheoryClient";

export const dynamic = "force-dynamic";

export default async function TheoryPage() {
  return <TheoryClient lessons={await getTheoryLessons()} />;
}
