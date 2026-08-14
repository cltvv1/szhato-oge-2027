export const PRACTICE_BLOCKS = ["paragraphs", "compression", "editing"] as const;
export type PracticeBlock = string;

export const PRACTICE_LEVELS = ["Разминка", "Практика", "Сложное"] as const;
export type PracticeLevel = (typeof PRACTICE_LEVELS)[number];

export const PRACTICE_BLOCK_LABELS: Record<string, string> = {
  paragraphs: "Абзацы и микротемы",
  compression: "Сжатие текста",
  editing: "Редактор ошибок",
};

export const PRACTICE_BLOCK_DESCRIPTIONS: Record<string, string> = {
  paragraphs: "Учимся видеть смысловые части, восстанавливать порядок и формулировать микротемы.",
  compression: "Тренируем исключение, обобщение и упрощение без потери авторской мысли.",
  editing: "Находим речевые, логические и смысловые ошибки и собираем точный связный текст.",
};

export type PracticeSection = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  archived: boolean;
  deleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSeed: boolean;
};

export type PracticeSectionInput = Pick<PracticeSection, "title" | "description" | "published" | "sortOrder"> & {
  id?: string;
  archived?: boolean;
  deleted?: boolean;
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
  deleted: boolean;
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
> & { id?: string; archived?: boolean; deleted?: boolean };
