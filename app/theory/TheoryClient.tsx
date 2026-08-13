"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, CircleAlert } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProgress } from "../components/ProgressProvider";
import type { TheoryLesson } from "./types";

export function TheoryClient({ lessons }: { lessons: TheoryLesson[] }) {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [checked, setChecked] = useState(false);
  const { completed, toggleComplete } = useProgress();
  const lesson = lessons[index];
  const done = lesson ? completed.includes(lesson.id) : false;
  const lessonDone = lessons.filter((item) => completed.includes(item.id)).length;
  const correct = Boolean(lesson?.question && selectedOption === lesson.question.correctOptionId);

  if (!lesson) return <AppShell><main><section className="main"><div className="container empty-library"><h1>Уроки готовятся</h1><p>Автор скоро опубликует материалы теории.</p></div></section></main></AppShell>;

  function completeAndNext() {
    if (lesson.question && !(checked && correct) && !done) { setChecked(true); return; }
    if (!done) toggleComplete(lesson.id);
    if (index < lessons.length - 1) selectLesson(index + 1);
  }

  function selectLesson(nextIndex: number) {
    setIndex(nextIndex);
    setSelectedOption("");
    setChecked(false);
    window.scrollTo({ top: 180, behavior: "smooth" });
  }

  return (
    <AppShell>
      <main>
        <section className="page-intro"><div className="container page-intro-grid">
          <div><span className="eyebrow">Часть 1 · теория</span><h1 className="page-title">Разобраться в изложении</h1><p>{lessons.length} коротких уроков вместо зубрёжки: что слушать, что записывать и как сохранить смысл, когда сокращаешь текст.</p></div>
          <div className="progress-panel"><div className="progress-panel-top"><strong>Прогресс по теории</strong><span>{lessonDone} / {lessons.length}</span></div><div className="progress-bar"><span style={{ width: `${lessons.length ? lessonDone / lessons.length * 100 : 0}%` }} /></div><div className="progress-caption">Урок с тестом завершается после правильного ответа</div></div>
        </div></section>
        <section className="main"><div className="container lesson-layout">
          <aside className="lesson-sidebar" aria-label="Уроки курса">{lessons.map((item, itemIndex) => (
            <button type="button" key={item.id} className={`lesson-tab ${index === itemIndex ? "active" : ""}`} onClick={() => selectLesson(itemIndex)}><span className="lesson-tab-index">{completed.includes(item.id) ? <Check size={15} /> : itemIndex + 1}</span><span><strong>{item.short}</strong><small>{item.minutes} минут</small></span><ChevronRight size={15} /></button>
          ))}</aside>
          <article className="lesson-card">
            <span className="eyebrow">Урок {index + 1} из {lessons.length} · {lesson.minutes} минут</span><h2>{lesson.title}</h2><p className="lead">{lesson.intro}</p>
            {lesson.body.map((paragraph, paragraphIndex) => <p key={`${lesson.id}-body-${paragraphIndex}`}>{paragraph}</p>)}
            {lesson.bullets.length ? <><h3>Запомни</h3><ul>{lesson.bullets.map((item, itemIndex) => <li key={`${lesson.id}-bullet-${itemIndex}`}>{item}</li>)}</ul></> : null}
            {lesson.callout ? <div className="callout"><strong>Важно</strong>{lesson.callout}</div> : null}
            {lesson.before && lesson.after ? <div className="example"><div className="example-box"><span className="example-label">До сжатия</span>{lesson.before}</div><ArrowRight /><div className="example-box after"><span className="example-label">После сжатия</span>{lesson.after}</div></div> : null}
            {lesson.question ? <section className="lesson-test" aria-labelledby={`test-${lesson.id}`}><span className="eyebrow">Проверка после урока</span><h3 id={`test-${lesson.id}`}>{lesson.question.prompt}</h3><div className="lesson-test-options">{lesson.question.options.map((option) => <label key={option.id} className={`lesson-test-option ${checked && option.id === lesson.question?.correctOptionId ? "correct" : checked && selectedOption === option.id ? "wrong" : ""}`}><input type="radio" name={`question-${lesson.id}`} value={option.id} checked={selectedOption === option.id} onChange={() => { setSelectedOption(option.id); setChecked(false); }} /><span>{option.text}</span></label>)}</div>{checked ? <div className={`lesson-test-feedback ${correct ? "correct" : "wrong"}`}>{correct ? <CheckCircle2 /> : <CircleAlert />}<span><strong>{correct ? "Верно" : "Попробуй ещё раз"}</strong>{lesson.question.explanation || (correct ? "Можно переходить к следующему уроку." : "Вернись к ключевым тезисам урока.")}</span></div> : null}<button type="button" className="button button-secondary" disabled={!selectedOption} onClick={() => setChecked(true)}>Проверить ответ</button></section> : null}
            <div className="lesson-actions"><button type="button" className="button button-secondary" disabled={index === 0} onClick={() => selectLesson(Math.max(0, index - 1))}><ArrowLeft size={17} /> Предыдущий</button><button type="button" className="button button-primary" onClick={completeAndNext}>{index === lessons.length - 1 ? (done ? "Урок пройден" : "Завершить теорию") : "Урок понятен — дальше"} <ArrowRight size={17} /></button></div>
          </article>
        </div></section>
      </main>
    </AppShell>
  );
}
