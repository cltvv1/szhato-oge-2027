"use client";

import { useState } from "react";
import { Check, Eye, Headphones, RotateCcw, Save } from "lucide-react";
import type { AudioExercise } from "./types";
import { useProgress } from "../components/ProgressProvider";

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function AudioExerciseCard({ exercise, index }: { exercise: AudioExercise; index: number }) {
  const { answers, completed, saveAnswer, toggleComplete } = useProgress();
  const key = `audio-${exercise.id}`;
  const answer = answers[key] || "";
  const words = countWords(answer);
  const done = completed.includes(key);
  const [showText, setShowText] = useState(false);

  return (
    <article className={`audio-exercise-card ${done ? "completed" : ""}`}>
      <div className="audio-card-number">{done ? <Check size={20} /> : String(index + 1).padStart(2, "0")}</div>
      <div className="audio-card-main">
        <div className="audio-card-heading">
          <div>
            <div className="audio-card-meta">
              <span>{exercise.difficulty}</span>
              {formatDuration(exercise.durationSeconds) ? <span>{formatDuration(exercise.durationSeconds)}</span> : null}
            </div>
            <h2>{exercise.title}</h2>
            {exercise.description ? <p>{exercise.description}</p> : null}
          </div>
          <Headphones size={28} aria-hidden="true" />
        </div>

        <div className="audio-player-wrap">
          <div className="audio-instruction"><strong>Прослушай два раза.</strong> Между прослушиваниями восстанови микротемы и ключевые слова.</div>
          {/* A complete text transcript is available through the button below. */}
          <audio controls preload="metadata" src={exercise.audioUrl} aria-label={`Аудиозапись: ${exercise.title}`}>Ваш браузер не поддерживает аудио.</audio>{/* eslint-disable-line jsx-a11y/media-has-caption */}
        </div>

        <label className="field-label" htmlFor={`answer-${exercise.id}`}>Твоё сжатое изложение</label>
        <textarea
          id={`answer-${exercise.id}`}
          className="answer-field audio-answer"
          value={answer}
          onChange={(event) => saveAnswer(key, event.target.value)}
          placeholder="После второго прослушивания напиши изложение здесь…"
        />
        <div className="field-footer"><span>Ответ сохраняется на этом устройстве</span><span>{words} слов</span></div>

        <div className="exercise-actions">
          <button type="button" className={`button ${done ? "button-ghost" : "button-primary"}`} onClick={() => toggleComplete(key)}>
            {done ? <><Check size={17} /> Выполнено</> : <><Save size={17} /> Отметить выполненным</>}
          </button>
          <button type="button" className="button button-secondary" onClick={() => setShowText((value) => !value)}>
            <Eye size={17} /> {showText ? "Скрыть исходный текст" : "Показать исходный текст"}
          </button>
          {answer ? <button type="button" className="button button-secondary" onClick={() => saveAnswer(key, "")}><RotateCcw size={17} /> Очистить ответ</button> : null}
        </div>

        {showText ? (
          <div className="audio-source-text">
            <div className="audio-source-label">Исходный текст</div>
            <div>{exercise.sourceText}</div>
            {exercise.sourceName ? <small>Источник: {exercise.sourceName}</small> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
