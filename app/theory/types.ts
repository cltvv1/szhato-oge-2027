export type TheoryQuestionOption = { id: string; text: string };

export type TheoryQuestion = {
  prompt: string;
  options: TheoryQuestionOption[];
  correctOptionId: string;
  explanation: string;
};

export type TheoryLesson = {
  id: string;
  short: string;
  title: string;
  minutes: number;
  intro: string;
  body: string[];
  bullets: string[];
  callout: string;
  before: string;
  after: string;
  question: TheoryQuestion | null;
  published: boolean;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSeed: boolean;
};

export type TheoryLessonInput = Pick<TheoryLesson,
  "short" | "title" | "minutes" | "intro" | "body" | "bullets" | "callout" | "before" | "after" | "question" | "published" | "sortOrder"
> & { id?: string; archived?: boolean };
