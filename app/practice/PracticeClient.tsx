"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, Save, Trophy } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProgress } from "../components/ProgressProvider";
import { SubmitForReviewButton } from "../components/SubmitForReviewButton";
import {
  type PracticeBlock,
  type PracticeExercise,
  type PracticeSection,
} from "./types";

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function PracticeClient({ exercises, sections }: { exercises: PracticeExercise[]; sections: PracticeSection[] }) {
  const visibleSections = sections.filter((section) => exercises.some((exercise) => exercise.block === section.id));
  const firstBlock = visibleSections[0]?.id || sections[0]?.id || "paragraphs";
  const [filter, setFilter] = useState<PracticeBlock>(firstBlock);
  const [open, setOpen] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const { completed, answers, saveAnswer, toggleComplete } = useProgress();
  const shown = exercises.filter((exercise) => exercise.block === filter);
  const exerciseDone = exercises.filter((exercise) => completed.includes(exercise.id)).length;

  function selectBlock(block: PracticeBlock) {
    setFilter(block);
    setOpen(null);
  }

  return (
    <AppShell>
      <main>
        <section className="page-intro">
          <div className="container page-intro-grid">
            <div><span className="eyebrow">Часть 2 · практика</span><h1 className="page-title">Тренажёр навыков</h1><p>{exercises.length} упражнений по {visibleSections.length} направлениям. Выбери навык, пиши ответ, сверяйся с ориентиром и отмечай выполненное — всё сохранится автоматически.</p></div>
            <div className="progress-panel"><div className="progress-panel-top"><strong>Выполнено заданий</strong><span>{exerciseDone} / {exercises.length}</span></div><div className="progress-bar"><span style={{ width: `${exercises.length ? exerciseDone / exercises.length * 100 : 0}%` }} /></div><div className="progress-caption">Цель — не совпасть слово в слово, а сохранить смысл</div></div>
          </div>
        </section>
        <section className="main">
          <div className="container">
            <div className="filters practice-directions" role="tablist" aria-label="Направления практики">
              {visibleSections.map((section) => {
                const count = exercises.filter((exercise) => exercise.block === section.id).length;
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={filter === section.id}
                    key={section.id}
                    className={`filter-button ${filter === section.id ? "active" : ""}`}
                    onClick={() => selectBlock(section.id)}
                    disabled={!count}
                  >
                    <span>{section.title}</span><small>{count}</small>
                  </button>
                );
              })}
            </div>
            <div className="practice-direction-heading">
              <span>Текущее направление</span>
              <h2>{sections.find((section) => section.id === filter)?.title || "Практика"}</h2>
              <p>{sections.find((section) => section.id === filter)?.description}</p>
            </div>
            <div className="exercise-list">
              {shown.map((exercise, index) => {
                const isOpen = open === exercise.id;
                const done = completed.includes(exercise.id);
                const showModel = models.includes(exercise.id);
                const value = answers[exercise.id] || "";
                return (
                  <article key={exercise.id} className={`exercise ${done ? "completed" : ""}`}>
                    <button type="button" className="exercise-head" onClick={() => setOpen(isOpen ? null : exercise.id)} aria-expanded={isOpen}>
                      <span className="exercise-index">{done ? <Check size={18} /> : index + 1}</span>
                      <span><span className="exercise-title">{exercise.title}</span><span className="exercise-meta"><span>{exercise.level}</span><span>·</span><span>≈ {exercise.minutes} мин</span></span></span>
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {isOpen ? <div className="exercise-body">
                      <div className="source-text">{exercise.source}</div>
                      <p className="prompt">{exercise.prompt}</p>
                      <textarea className="answer-field" value={value} onChange={(event) => saveAnswer(exercise.id, event.target.value)} placeholder="Напиши свой ответ здесь…" aria-label={`Ответ на задание «${exercise.title}»`} />
                      <div className="field-footer"><span>Ответ сохраняется на этом устройстве</span><span>{wordCount(value)} слов</span></div>
                      <div className="exercise-actions">
                        <button type="button" className={`button ${done ? "button-ghost" : "button-primary"}`} onClick={() => toggleComplete(exercise.id)}>{done ? <><Check size={17} /> Выполнено</> : <><Save size={17} /> Отметить выполненным</>}</button>
                        <button type="button" className="button button-secondary" onClick={() => setModels((items) => showModel ? items.filter((id) => id !== exercise.id) : [...items, exercise.id])}><Eye size={17} /> {showModel ? "Скрыть ориентир" : "Показать ориентир"}</button>
                        <SubmitForReviewButton kind="practice" taskId={exercise.id} answer={value} />
                      </div>
                      {showModel ? <div className="model-answer"><strong>Возможный разбор</strong>{exercise.model}</div> : null}
                    </div> : null}
                  </article>
                );
              })}
            </div>
            {exerciseDone === exercises.length && exercises.length ? <div className="quote-band"><Trophy size={52} /><blockquote>Ты прошёл весь тренажёр. Теперь навык пора проверить в экзаменационном режиме.</blockquote></div> : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
