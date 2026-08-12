"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, EyeOff, RotateCcw, Send } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProgress } from "../components/ProgressProvider";
import { examText } from "../data";

const checklist = ["Переданы все три микротемы", "В каждом абзаце есть сжатие", "Нет мыслей и примеров от себя", "Сохранён авторский порядок", "Связки употреблены логично", "Проверены согласование и запятые"];
function countWords(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }
function formatTime(sec: number) { return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`; }

export default function SimulatorPage() {
  const { answers, saveAnswer, completed, toggleComplete } = useProgress();
  const [stage, setStage] = useState<"listen" | "write" | "check">("listen");
  const [listens, setListens] = useState(0);
  const [visible, setVisible] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [checks, setChecks] = useState<boolean[]>(checklist.map(() => false));
  const answer = answers["exam-main"] || "";
  const words = useMemo(() => countWords(answer), [answer]);
  const isDone = completed.includes("exam-main");

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  function beginReading() {
    setVisible(true); setListens((x) => Math.min(2, x + 1));
  }
  function finish() {
    setStage("check");
    if (!isDone) toggleComplete("exam-main");
  }
  function reset() {
    setStage("listen"); setListens(0); setVisible(false); setSeconds(0); setChecks(checklist.map(() => false)); saveAnswer("exam-main", "");
    if (isDone) toggleComplete("exam-main");
  }

  return (
    <AppShell>
      <main>
        <section className="page-intro">
          <div className="container page-intro-grid">
            <div><span className="eyebrow">Часть 3 · репетиция</span><h1 className="page-title">Экзаменационный режим</h1><p>Пройди полный цикл: два чтения, черновик, чистовик и финальная проверка. Текст здесь показан вместо аудио — попроси кого-нибудь прочитать его вслух.</p></div>
            <div className="progress-panel"><div className="progress-panel-top"><strong>Режим работы</strong><span>{stage === "listen" ? "Слушаем" : stage === "write" ? "Пишем" : "Проверяем"}</span></div><div className="progress-bar"><span style={{ width: stage === "listen" ? "33%" : stage === "write" ? "66%" : "100%" }} /></div><div className="progress-caption">Таймер идёт с момента открытия страницы</div></div>
          </div>
        </section>
        <section className="main">
          <div className="container">
            <div className="exam-steps"><span className={`exam-step ${stage === "listen" ? "active" : ""}`} /><span className={`exam-step ${stage === "write" ? "active" : ""}`} /><span className={`exam-step ${stage === "check" ? "active" : ""}`} /></div>
            <div className="sim-grid">
              <section className="workspace-card">
                <div className="workspace-head"><h2>{stage === "listen" ? "Исходный текст" : stage === "write" ? "Твоё изложение" : "Работа завершена"}</h2><span className="timer"><Clock3 size={18} />{formatTime(seconds)}</span></div>
                <div className="workspace-body">
                  {stage === "listen" && <>
                    <div className={`exam-source ${!visible ? "hidden-text" : ""}`}>{visible ? examText : <div><EyeOff size={34} style={{ margin: "0 auto 12px" }} /><strong>Текст скрыт</strong><p>Открой его только на время чтения. После закрой и работай по заметкам.</p></div>}</div>
                    <div className="exercise-actions">
                      <button className="button button-secondary" onClick={visible ? () => setVisible(false) : beginReading}>{visible ? <><EyeOff size={17} /> Закрыть текст</> : <><Eye size={17} /> {listens === 0 ? "Первое чтение" : "Второе чтение"}</>}</button>
                      <button className="button button-primary" disabled={listens < 2} onClick={() => { setVisible(false); setStage("write"); }}>Перейти к изложению</button>
                    </div>
                    {listens < 2 && <div className="notice" style={{ marginTop: 16 }}>Открой и закрой текст два раза. Между чтениями восстанови тему, три микротемы и пропущенные ключевые слова.</div>}
                  </>}
                  {stage === "write" && <>
                    <textarea className="exam-textarea" value={answer} onChange={(ev) => saveAnswer("exam-main", ev.target.value)} placeholder="Напиши сжатое изложение. Отделяй абзацы пустой строкой…" aria-label="Текст сжатого изложения" />
                    <div className="field-footer"><span>Черновик сохраняется автоматически</span><span>{words} слов</span></div>
                    <div className="exercise-actions"><button className="button button-primary" onClick={() => setStage("check")}>Перейти к проверке <CheckCircle2 size={17} /></button></div>
                  </>}
                  {stage === "check" && <>
                    <div className="model-answer"><strong>{isDone ? "Работа сохранена" : "Финальная проверка"}</strong>{words >= 70 ? `Объём — ${words} слов. Минимум выполнен.` : `Сейчас ${words} слов. До обязательного минимума не хватает ${70 - words}.`}</div>
                    <div className="source-text" style={{ whiteSpace: "pre-wrap" }}>{answer || "Текст пока не написан."}</div>
                    <div className="exercise-actions"><button className="button button-secondary" onClick={() => setStage("write")}>Вернуться к тексту</button><button className="button button-primary" disabled={checks.some((x) => !x) || words < 70} onClick={finish}><Send size={17} /> Завершить работу</button></div>
                  </>}
                </div>
              </section>
              <aside className="side-stack">
                <div className="side-card"><h3>Объём</h3><div className={`word-count ${words > 0 && words < 70 ? "bad" : ""}`}>{words}</div><div className="word-label">слов · нужно не менее 70</div></div>
                <div className="side-card"><h3>Чек-лист на 6 баллов</h3>{checklist.map((item, i) => <label className="check-row" key={item}><input type="checkbox" checked={checks[i]} onChange={() => setChecks((prev) => prev.map((v, n) => n === i ? !v : v))} /><span>{item}</span></label>)}</div>
                <button className="button button-secondary" onClick={reset}><RotateCcw size={17} /> Начать заново</button>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
