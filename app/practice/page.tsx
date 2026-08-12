"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, Save, Trophy } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProgress } from "../components/ProgressProvider";
import { exercises } from "../data";

const filters = [
  ["all", "Все задания"], ["paragraphs", "Абзацы и микротемы"], ["compression", "Сжатие текста"], ["editing", "Редактор ошибок"],
] as const;

function wordCount(text: string) { return text.trim() ? text.trim().split(/\s+/).length : 0; }

export default function PracticePage() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all");
  const [open, setOpen] = useState<string | null>(exercises[0].id);
  const [models, setModels] = useState<string[]>([]);
  const { completed, answers, saveAnswer, toggleComplete } = useProgress();
  const shown = useMemo(() => exercises.filter((e) => filter === "all" || e.block === filter), [filter]);
  const exerciseDone = exercises.filter((e) => completed.includes(e.id)).length;

  return (
    <AppShell>
      <main>
        <section className="page-intro">
          <div className="container page-intro-grid">
            <div><span className="eyebrow">Часть 2 · практика</span><h1 className="page-title">Тренажёр навыков</h1><p>26 упражнений из программы тетради. Пиши ответ, сверяйся с ориентиром и отмечай выполненное — всё сохранится автоматически.</p></div>
            <div className="progress-panel"><div className="progress-panel-top"><strong>Выполнено заданий</strong><span>{exerciseDone} / {exercises.length}</span></div><div className="progress-bar"><span style={{ width: `${exerciseDone / exercises.length * 100}%` }} /></div><div className="progress-caption">Цель — не совпасть слово в слово, а сохранить смысл</div></div>
          </div>
        </section>
        <section className="main">
          <div className="container">
            <div className="filters" role="group" aria-label="Фильтр заданий">
              {filters.map(([id, label]) => <button key={id} className={`filter-button ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>{label}</button>)}
            </div>
            <div className="exercise-list">
              {shown.map((exercise, idx) => {
                const isOpen = open === exercise.id;
                const done = completed.includes(exercise.id);
                const showModel = models.includes(exercise.id);
                const value = answers[exercise.id] || "";
                return (
                  <article key={exercise.id} className={`exercise ${done ? "completed" : ""}`}>
                    <button className="exercise-head" onClick={() => setOpen(isOpen ? null : exercise.id)} aria-expanded={isOpen}>
                      <span className="exercise-index">{done ? <Check size={18} /> : idx + 1}</span>
                      <span><span className="exercise-title">{exercise.title}</span><span className="exercise-meta"><span>{exercise.level}</span><span>·</span><span>≈ {exercise.minutes} мин</span></span></span>
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {isOpen && <div className="exercise-body">
                      <div className="source-text">{exercise.source}</div>
                      <p className="prompt">{exercise.prompt}</p>
                      <textarea className="answer-field" value={value} onChange={(ev) => saveAnswer(exercise.id, ev.target.value)} placeholder="Напиши свой ответ здесь…" aria-label={`Ответ на задание «${exercise.title}»`} />
                      <div className="field-footer"><span>Ответ сохраняется на устройстве</span><span>{wordCount(value)} слов</span></div>
                      <div className="exercise-actions">
                        <button className={`button ${done ? "button-ghost" : "button-primary"}`} onClick={() => toggleComplete(exercise.id)}>{done ? <><Check size={17} /> Выполнено</> : <><Save size={17} /> Отметить выполненным</>}</button>
                        <button className="button button-secondary" onClick={() => setModels((m) => showModel ? m.filter((x) => x !== exercise.id) : [...m, exercise.id])}><Eye size={17} /> {showModel ? "Скрыть ориентир" : "Показать ориентир"}</button>
                      </div>
                      {showModel && <div className="model-answer"><strong>Возможный разбор</strong>{exercise.model}</div>}
                    </div>}
                  </article>
                );
              })}
            </div>
            {exerciseDone === exercises.length && <div className="quote-band"><Trophy size={52} /><blockquote>Ты прошёл весь тренажёр. Теперь навык пора проверить в экзаменационном режиме.</blockquote></div>}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
