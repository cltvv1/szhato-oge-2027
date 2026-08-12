"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProgress } from "../components/ProgressProvider";
import { lessons } from "../data";

export default function TheoryPage() {
  const [index, setIndex] = useState(0);
  const { completed, toggleComplete } = useProgress();
  const lesson = lessons[index];
  const done = completed.includes(lesson.id);
  const lessonDone = lessons.filter((l) => completed.includes(l.id)).length;

  function next() {
    if (!done) toggleComplete(lesson.id);
    if (index < lessons.length - 1) { setIndex(index + 1); window.scrollTo({ top: 180, behavior: "smooth" }); }
  }

  return (
    <AppShell>
      <main>
        <section className="page-intro">
          <div className="container page-intro-grid">
            <div><span className="eyebrow">Часть 1 · теория</span><h1 className="page-title">Разобраться в изложении</h1><p>Шесть коротких уроков вместо зубрёжки: что слушать, что записывать и как сохранить смысл, когда сокращаешь текст.</p></div>
            <div className="progress-panel"><div className="progress-panel-top"><strong>Прогресс по теории</strong><span>{lessonDone} / {lessons.length}</span></div><div className="progress-bar"><span style={{ width: `${lessonDone / lessons.length * 100}%` }} /></div><div className="progress-caption">Можно проходить в любом порядке</div></div>
          </div>
        </section>
        <section className="main">
          <div className="container lesson-layout">
            <aside className="lesson-sidebar" aria-label="Уроки курса">
              {lessons.map((item, i) => (
                <button key={item.id} className={`lesson-tab ${index === i ? "active" : ""}`} onClick={() => setIndex(i)}>
                  <span className="lesson-tab-index">{completed.includes(item.id) ? <Check size={15} /> : i + 1}</span>
                  <span><strong>{item.short}</strong><small>{item.minutes} минут</small></span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </aside>
            <article className="lesson-card">
              <span className="eyebrow">Урок {index + 1} из {lessons.length} · {lesson.minutes} минут</span>
              <h2>{lesson.title}</h2>
              <p className="lead">{lesson.intro}</p>
              {lesson.body.map((p) => <p key={p}>{p}</p>)}
              {lesson.bullets && <><h3>Запомни</h3><ul>{lesson.bullets.map((item) => <li key={item}>{item}</li>)}</ul></>}
              {lesson.callout && <div className="callout"><strong>Важно</strong>{lesson.callout}</div>}
              {lesson.before && lesson.after && <div className="example"><div className="example-box"><span className="example-label">До сжатия</span>{lesson.before}</div><ArrowRight /><div className="example-box after"><span className="example-label">После сжатия</span>{lesson.after}</div></div>}
              <div className="lesson-actions">
                <button className="button button-secondary" disabled={index === 0} onClick={() => setIndex(Math.max(0, index - 1))}><ArrowLeft size={17} /> Предыдущий</button>
                <button className="button button-primary" onClick={next}>{index === lessons.length - 1 ? (done ? "Урок пройден" : "Завершить теорию") : "Урок понятен — дальше"} <ArrowRight size={17} /></button>
              </div>
            </article>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
