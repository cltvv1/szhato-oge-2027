"use client";

import { useMemo, useState } from "react";
import { Check, Dice5, Eye, Headphones, RotateCcw, Save } from "lucide-react";
import { useProgress } from "../components/ProgressProvider";
import { SubmitForReviewButton } from "../components/SubmitForReviewButton";
import { AUDIO_DIFFICULTIES, type AudioExercise, type AudioDifficulty } from "./types";

function wordCount(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }
function duration(seconds: number | null) { return seconds ? `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}` : null; }

export function AudioCatalogClient({ exercises }: { exercises: AudioExercise[] }) {
  const { answers, completed, saveAnswer, toggleComplete } = useProgress();
  const [selectedId, setSelectedId] = useState(exercises[0]?.id || "");
  const [difficulty, setDifficulty] = useState<AudioDifficulty | "all">("all");
  const [onlyUnfinished, setOnlyUnfinished] = useState(false);
  const [showText, setShowText] = useState(false);
  const filtered = useMemo(() => exercises.filter((item) => (difficulty === "all" || item.difficulty === difficulty) && (!onlyUnfinished || !completed.includes(`audio-${item.id}`))), [exercises, difficulty, onlyUnfinished, completed]);
  const selected = exercises.find((item) => item.id === selectedId) || filtered[0] || exercises[0];
  const doneCount = exercises.filter((item) => completed.includes(`audio-${item.id}`)).length;
  if (!selected) return null;
  const answerKey = `audio-${selected.id}`;
  const notesKey = `audio-notes-${selected.id}`;
  const answer = answers[answerKey] || "";
  const notes = answers[notesKey] || "";
  const done = completed.includes(answerKey);

  function randomExercise() {
    const unfinished = filtered.filter((item) => !completed.includes(`audio-${item.id}`));
    const pool = unfinished.length ? unfinished : filtered.length ? filtered : exercises;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) { setSelectedId(next.id); setShowText(false); }
  }

  return <div className="audio-catalog">
    <aside className="audio-library-panel">
      <div className="audio-library-progress"><div><strong>Пройдено</strong><span>{doneCount} / {exercises.length}</span></div><div className="progress-bar"><span style={{ width: `${exercises.length ? doneCount / exercises.length * 100 : 0}%` }} /></div></div>
      <button type="button" className="button button-primary audio-random" onClick={randomExercise}><Dice5 size={18} /> Случайный текст</button>
      <div className="audio-filters"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as AudioDifficulty | "all")} aria-label="Сложность аудиотекста"><option value="all">Любая сложность</option>{AUDIO_DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select><label><input type="checkbox" checked={onlyUnfinished} onChange={(event) => setOnlyUnfinished(event.target.checked)} /> Только непройденные</label></div>
      <div className="audio-library-list">{filtered.map((item, index) => { const itemDone = completed.includes(`audio-${item.id}`); return <button type="button" key={item.id} className={`audio-library-item ${selected.id === item.id ? "active" : ""}`} onClick={() => { setSelectedId(item.id); setShowText(false); }}><span className="audio-library-number">{itemDone ? <Check size={15} /> : index + 1}</span><span><strong>{item.title}</strong><small>{item.difficulty}{duration(item.durationSeconds) ? ` · ${duration(item.durationSeconds)}` : ""}</small></span></button>; })}{!filtered.length ? <p className="audio-filter-empty">По выбранным условиям записей нет.</p> : null}</div>
    </aside>
    <article className={`audio-workspace ${done ? "completed" : ""}`}>
      <div className="audio-card-heading"><div><div className="audio-card-meta"><span>{selected.difficulty}</span>{duration(selected.durationSeconds) ? <span>{duration(selected.durationSeconds)}</span> : null}</div><h2>{selected.title}</h2>{selected.description ? <p>{selected.description}</p> : null}</div><Headphones size={28} /></div>
      <div className="audio-player-wrap"><div className="audio-instruction"><strong>Свободная тренировка.</strong> Слушай столько раз, сколько нужно, и постепенно улучшай заметки.</div><audio controls preload="metadata" src={selected.audioUrl} aria-label={`Аудиозапись: ${selected.title}`}>Ваш браузер не поддерживает аудио.</audio></div>{/* eslint-disable-line jsx-a11y/media-has-caption */}
      <label className="field-label" htmlFor={`notes-${selected.id}`}>Черновик и заметки</label><textarea id={`notes-${selected.id}`} className="answer-field audio-notes" value={notes} onChange={(event) => saveAnswer(notesKey, event.target.value)} placeholder="Записывай тему, микротемы, ключевые слова и связи…" /><div className="field-footer"><span>Заметки сохраняются на этом устройстве</span><span>{wordCount(notes)} слов</span></div>
      <label className="field-label" htmlFor={`answer-${selected.id}`}>Твоё сжатое изложение</label><textarea id={`answer-${selected.id}`} className="answer-field audio-answer" value={answer} onChange={(event) => saveAnswer(answerKey, event.target.value)} placeholder="Когда будешь готов, собери связное изложение…" /><div className="field-footer"><span>Изложение сохраняется автоматически</span><span>{wordCount(answer)} слов</span></div>
      <div className="exercise-actions"><button type="button" className={`button ${done ? "button-ghost" : "button-primary"}`} onClick={() => toggleComplete(answerKey)}>{done ? <><Check size={17} /> Выполнено</> : <><Save size={17} /> Отметить выполненным</>}</button><button type="button" className="button button-secondary" onClick={() => setShowText((value) => !value)}><Eye size={17} /> {showText ? "Скрыть исходный текст" : "Показать исходный текст"}</button>{answer || notes ? <button type="button" className="button button-secondary" onClick={() => { saveAnswer(answerKey, ""); saveAnswer(notesKey, ""); }}><RotateCcw size={17} /> Очистить работу</button> : null}<SubmitForReviewButton kind="audio" taskId={selected.id} answer={answer} notes={notes} /></div>
      {showText ? <div className="audio-source-text"><div className="audio-source-label">Исходный текст</div><div>{selected.sourceText}</div>{selected.sourceName ? <small>Источник: {selected.sourceName}</small> : null}</div> : null}
    </article>
  </div>;
}
