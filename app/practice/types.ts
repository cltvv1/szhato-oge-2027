export const PRACTICE_BLOCKS = ["paragraphs", "compression", "editing"] as const;
export type PracticeBlock = (typeof PRACTICE_BLOCKS)[number];

export const PRACTICE_LEVELS = ["Разминка", "Практика", "Сложное"] as const;
export type PracticeLevel = (typeof PRACTICE_LEVELS)[number];

export const PRACTICE_BLOCK_LABELS: Record<PracticeBlock, string> = {
  paragraphs: "Абзацы и микротемы",
  compression: "Сжатие текста",
  editing: "Редактор ошибок",
};

export type PracticeExercise = {
  id: string;
  block: PracticeBlock;
  title: string;
  level: PracticeLevel;
  minutes: number;
  source: string;
  prompt: string;
  model: string;
  published: boolean;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSeed: boolean;
};

export type PracticeExerciseInput = Pick<
  PracticeExercise,
  | "block"
  | "title"
  | "level"
  | "minutes"
  | "source"
  | "prompt"
  | "model"
  | "published"
  | "sortOrder"
> & { id?: string; archived?: boolean };
