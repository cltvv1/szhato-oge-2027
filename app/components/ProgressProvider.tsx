"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ProgressContextValue = {
  completed: string[];
  answers: Record<string, string>;
  toggleComplete: (id: string) => void;
  saveAnswer: (id: string, answer: string) => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);
const KEY = "szhato-progress-v1";

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = window.setTimeout(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      setCompleted(Array.isArray(saved.completed) ? saved.completed : []);
      setAnswers(saved.answers && typeof saved.answers === "object" ? saved.answers : {});
    } catch { /* start clean */ }
    setReady(true);
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify({ completed, answers }));
  }, [completed, answers, ready]);

  const value = useMemo(() => ({
    completed,
    answers,
    toggleComplete: (id: string) => setCompleted((items) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id]),
    saveAnswer: (id: string, answer: string) => setAnswers((items) => ({ ...items, [id]: answer })),
    reset: () => { setCompleted([]); setAnswers({}); },
  }), [completed, answers]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used within ProgressProvider");
  return value;
}
