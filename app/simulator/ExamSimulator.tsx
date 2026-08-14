"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Dice5, Headphones, Play, RotateCcw, Send } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProgress } from "../components/ProgressProvider";
import { SubmitForReviewButton } from "../components/SubmitForReviewButton";
import type { AudioDifficulty } from "../audio/types";

type ExamVariant = { id: string; title: string; description: string; difficulty: AudioDifficulty; durationSeconds: number | null; audioUrl: string };
const checklist = ["Переданы все микротемы", "В каждом абзаце есть сжатие", "Нет мыслей и примеров от себя", "Сохранён авторский порядок", "Связки употреблены логично", "Проверены согласование и запятые"];
function countWords(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }
function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

export function ExamSimulator({ variants }: { variants: ExamVariant[] }) {
  const { answers, saveAnswer, completed, toggleComplete } = useProgress();
  const [variant, setVariant] = useState<ExamVariant | null>(null);
  const [stage, setStage] = useState<"select" | "listen" | "write" | "check">("select");
  const [listens, setListens] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false));
  const audioRef = useRef<HTMLAudioElement>(null);
  const answerKey = variant ? `exam-${variant.id}` : "";
  const notesKey = variant ? `exam-notes-${variant.id}` : "";
  const answer = answerKey ? answers[answerKey] || "" : "";
  const notes = notesKey ? answers[notesKey] || "" : "";
  const words = useMemo(() => countWords(answer), [answer]);
  const isDone = answerKey ? completed.includes(answerKey) : false;

  useEffect(() => {
    if (stage === "select" || isDone) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage, isDone]);

  function choose(item: ExamVariant) { setVariant(item); setStage("listen"); setListens(0); setSeconds(0); setChecks(checklist.map(() => false)); setPlaying(false); }
  function chooseRandom() { if (variants.length) choose(variants[Math.floor(Math.random() * variants.length)]); }
  async function startListening() {
    if (!audioRef.current || playing || listens >= 2) return;
    audioRef.current.currentTime = 0;
    setPlaying(true);
    try { await audioRef.current.play(); } catch { setPlaying(false); }
  }
  function listeningEnded() { setPlaying(false); setListens((value) => Math.min(2, value + 1)); }
  function finish() { if (!isDone && answerKey) toggleComplete(answerKey); }
  function resetAttempt() { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } setStage("select"); setVariant(null); setListens(0); setPlaying(false); setSeconds(0); setChecks(checklist.map(() => false)); }

  return <AppShell><main>
    <section className="page-intro"><div className="container page-intro-grid"><div><span className="eyebrow">Часть 4 · репетиция</span><h1 className="page-title">Экзаменационный режим</h1><p>Два прослушивания без перемотки, черновик, изложение и финальная самопроверка. Исходный текст во время попытки недоступен.</p></div><div className="progress-panel"><div className="progress-panel-top"><strong>Режим работы</strong><span>{stage === "select" ? "Выбор" : stage === "listen" ? "Слушаем" : stage === "write" ? "Пишем" : "Проверяем"}</span></div><div className="progress-bar"><span style={{ width: stage === "select" ? "10%" : stage === "listen" ? "33%" : stage === "write" ? "66%" : "100%" }} /></div><div className="progress-caption">Таймер запускается после выбора варианта</div></div></div></section>
    <section className="main"><div className="container">
      {stage === "select" ? <section className="exam-select"><div className="section-head"><div><span className="eyebrow">Банк вариантов</span><h2 className="section-title">Выбери репетицию</h2></div><button type="button" className="button button-primary" onClick={chooseRandom} disabled={!variants.length}><Dice5 size={18} /> Случайный вариант</button></div>{variants.length ? <div className="exam-variant-grid">{variants.map((item, index) => <button type="button" className="exam-variant-card" key={item.id} onClick={() => choose(item)}><span>{String(index + 1).padStart(2, "0")}</span><Headphones /><strong>{item.title}</strong><small>{item.difficulty}{item.durationSeconds ? ` · ${Math.ceil(item.durationSeconds / 60)} мин` : ""}</small></button>)}</div> : <div className="empty-library"><Headphones size={38} /><h2>Экзаменационные варианты готовятся</h2><p>Автор сможет отметить подходящие аудиозаписи в панели управления.</p></div>}</section> : variant ? <><div className="exam-steps"><span className={`exam-step ${stage === "listen" ? "active" : ""}`} /><span className={`exam-step ${stage === "write" ? "active" : ""}`} /><span className={`exam-step ${stage === "check" ? "active" : ""}`} /></div><div className="sim-grid"><section className="workspace-card"><div className="workspace-head"><div><span className="eyebrow">{variant.difficulty}</span><h2>{variant.title}</h2></div><span className="timer"><Clock3 size={18} />{formatTime(seconds)}</span></div><div className="workspace-body">
        {stage === "listen" ? <><div className="exam-audio-stage"><Headphones size={42} /><strong>{playing ? `Идёт прослушивание ${listens + 1} из 2` : listens === 0 ? "Готово первое прослушивание" : listens === 1 ? "Первое завершено — восстанови пропуски" : "Два прослушивания завершены"}</strong><p>{playing ? "Сосредоточься на смысле и продолжай делать заметки." : listens < 2 ? "Запись начнётся с начала и будет воспроизведена без перемотки." : "Аудиозапись заблокирована. Переходи к изложению."}</p>{/* The source transcript is stored in the admin library but deliberately hidden during an exam attempt. */}<audio ref={audioRef} src={variant.audioUrl} preload="metadata" onEnded={listeningEnded} onError={() => setPlaying(false)} />{/* eslint-disable-line jsx-a11y/media-has-caption */}{listens < 2 ? <button type="button" className="button button-primary" onClick={startListening} disabled={playing}><Play size={18} /> {listens === 0 ? "Первое прослушивание" : "Второе прослушивание"}</button> : null}</div><label className="field-label" htmlFor="exam-notes">Черновик и заметки</label><textarea id="exam-notes" className="exam-notes-field" value={notes} onChange={(event) => saveAnswer(notesKey, event.target.value)} placeholder="Тема, микротемы, ключевые слова, стрелки и сокращения…" /><div className="field-footer"><span>Черновик останется доступен при написании</span><span>{countWords(notes)} слов</span></div><div className="exercise-actions"><button type="button" className="button button-primary" disabled={listens < 2 || playing} onClick={() => setStage("write")}>Перейти к изложению</button></div></> : null}
        {stage === "write" ? <><div className="exam-notes-reference"><strong>Твой черновик</strong><div>{notes || "Заметок нет."}</div></div><textarea className="exam-textarea" value={answer} onChange={(event) => saveAnswer(answerKey, event.target.value)} placeholder="Напиши сжатое изложение. Отделяй абзацы пустой строкой…" aria-label="Текст сжатого изложения" /><div className="field-footer"><span>Изложение сохраняется автоматически</span><span>{words} слов</span></div><div className="exercise-actions"><button type="button" className="button button-primary" onClick={() => setStage("check")}>Перейти к проверке <CheckCircle2 size={17} /></button></div></> : null}
        {stage === "check" ? <><div className="model-answer"><strong>{isDone ? "Попытка завершена" : "Финальная проверка"}</strong>{words >= 70 ? `Объём — ${words} слов. Минимум выполнен.` : `Сейчас ${words} слов. До обязательного минимума не хватает ${70 - words}.`}</div><div className="source-text" style={{ whiteSpace: "pre-wrap" }}>{answer || "Текст пока не написан."}</div><div className="exercise-actions"><button type="button" className="button button-secondary" onClick={() => setStage("write")}>Вернуться к тексту</button><button type="button" className="button button-primary" disabled={checks.some((value) => !value) || words < 70 || isDone} onClick={finish}><Send size={17} /> {isDone ? "Работа завершена" : "Завершить работу"}</button>{words >= 70 ? <SubmitForReviewButton kind="exam" taskId={variant.id} answer={answer} notes={notes} /> : null}</div></> : null}
      </div></section><aside className="side-stack"><div className="side-card"><h3>Объём</h3><div className={`word-count ${words > 0 && words < 70 ? "bad" : ""}`}>{words}</div><div className="word-label">слов · нужно не менее 70</div></div><div className="side-card"><h3>Чек-лист</h3>{checklist.map((item, index) => <label className="check-row" key={item}><input type="checkbox" checked={checks[index]} onChange={() => setChecks((previous) => previous.map((value, itemIndex) => itemIndex === index ? !value : value))} /><span>{item}</span></label>)}</div><button type="button" className="button button-secondary" onClick={resetAttempt}><RotateCcw size={17} /> Другой вариант</button></aside></div></> : null}
    </div></section>
  </main></AppShell>;
}
