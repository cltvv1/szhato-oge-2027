export const AUDIO_DIFFICULTIES = ["Базовый", "Средний", "Экзаменационный"] as const;

export type AudioDifficulty = (typeof AUDIO_DIFFICULTIES)[number];

export type AudioExercise = {
  id: string;
  title: string;
  description: string;
  sourceText: string;
  sourceName: string;
  difficulty: AudioDifficulty;
  published: boolean;
  availableInAudio: boolean;
  availableInExam: boolean;
  audioUrl: string;
  audioPathname: string;
  audioSize: number;
  audioContentType: string;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AudioExerciseInput = Pick<
  AudioExercise,
  | "title"
  | "description"
  | "sourceText"
  | "sourceName"
  | "difficulty"
  | "published"
  | "availableInAudio"
  | "availableInExam"
  | "audioUrl"
  | "audioPathname"
  | "audioSize"
  | "audioContentType"
  | "durationSeconds"
> & { id?: string };
