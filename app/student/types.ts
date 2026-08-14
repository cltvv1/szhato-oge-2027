export type StudentProfile = {
  id: string;
  displayName: string;
  codeHint: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionKind = "practice" | "audio" | "exam";
export type SubmissionStatus = "pending" | "reviewed" | "returned";

export type StudentSubmission = {
  id: string;
  studentId: string;
  kind: SubmissionKind;
  taskId: string;
  taskTitle: string;
  answer: string;
  notes: string;
  status: SubmissionStatus;
  score: number | null;
  maxScore: number;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};
