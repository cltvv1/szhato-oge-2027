"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Check, ClipboardCheck, Copy, KeyRound, LoaderCircle, Plus, RefreshCcw, Trash2, UserRound } from "lucide-react";
import type { StudentProfile, StudentSubmission } from "../student/types";

type ClassroomData = { students: StudentProfile[]; submissions: StudentSubmission[] };
type AccessCodeResult = { student: StudentProfile; accessCode: string };

function kindLabel(kind: StudentSubmission["kind"]) {
  return kind === "practice" ? "Практика" : kind === "audio" ? "Аудиотренажёр" : "Экзамен";
}

function SubmissionReviewCard({ submission, studentName, onSaved }: { submission: StudentSubmission; studentName: string; onSaved: () => Promise<void> }) {
  const [status, setStatus] = useState<"reviewed" | "returned">(submission.status === "returned" ? "returned" : "reviewed");
  const [score, setScore] = useState(submission.score?.toString() || "");
  const [maxScore, setMaxScore] = useState(submission.maxScore.toString());
  const [feedback, setFeedback] = useState(submission.feedback);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    const response = await fetch("/api/admin/classroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reviewSubmission", submissionId: submission.id, status, score: score === "" ? null : Number(score), maxScore: Number(maxScore), feedback }),
    });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось сохранить проверку."); return; }
    setSaved(true); await onSaved();
  }

  return <article className={`teacher-submission-card ${submission.status}`}>
    <div className="teacher-submission-head"><div><span>{kindLabel(submission.kind)} · {new Date(submission.createdAt).toLocaleDateString("ru-RU")}</span><h3>{submission.taskTitle}</h3><small>{studentName}</small></div><span className={`submission-status ${submission.status}`}>{submission.status === "pending" ? "На проверке" : submission.status === "returned" ? "На доработке" : "Проверено"}</span></div>
    <details open={submission.status === "pending"}><summary>Работа ученика</summary><div className="submission-text">{submission.answer}</div>{submission.notes ? <><strong className="submission-notes-title">Черновик и заметки</strong><div className="submission-text notes">{submission.notes}</div></> : null}</details>
    <form className="teacher-review-form" onSubmit={submit}>
      <div className="teacher-score-fields"><label><span>Балл</span><input className="admin-input" type="number" min="0" max={Number(maxScore) || 100} step="0.5" value={score} onChange={(event) => setScore(event.target.value)} placeholder="—" /></label><label><span>Из</span><input className="admin-input" type="number" min="1" max="100" step="1" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} required /></label><label><span>Решение</span><select className="admin-input" value={status} onChange={(event) => setStatus(event.target.value as "reviewed" | "returned")}><option value="reviewed">Проверено</option><option value="returned">Вернуть на доработку</option></select></label></div>
      <label><span>Комментарий ученику</span><textarea className="admin-input admin-small-textarea" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Что получилось и над чем поработать…" maxLength={10000} /></label>
      {error ? <div className="form-error">{error}</div> : null}{saved ? <div className="form-success"><Check size={17} /> Проверка сохранена</div> : null}
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ClipboardCheck size={17} />} Сохранить оценку</button>
    </form>
  </article>;
}

export function ClassroomAdmin() {
  const [data, setData] = useState<ClassroomData>({ students: [], submissions: [] });
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [displayName, setDisplayName] = useState("");
  const [latestCode, setLatestCode] = useState<AccessCodeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/classroom", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Не удалось загрузить учеников."); setLoading(false); return; }
    setData(result); setLoading(false);
  }, []);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  async function action(body: Record<string, unknown>) {
    setBusy(true); setError(""); setCopied(false);
    const response = await fetch("/api/admin/classroom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setError(result.error || "Не удалось выполнить действие."); return null; }
    return result;
  }

  async function createStudent(event: React.FormEvent) {
    event.preventDefault(); const result = await action({ action: "createStudent", displayName });
    if (!result) return; setLatestCode(result); setDisplayName(""); await load();
  }

  async function regenerate(student: StudentProfile) {
    if (!window.confirm(`Создать новый код для ${student.displayName}? Старый код перестанет работать.`)) return;
    const result = await action({ action: "regenerateCode", studentId: student.id });
    if (!result) return; setLatestCode(result); await load();
  }

  async function archive(student: StudentProfile) {
    if (!window.confirm(`Закрыть доступ для ${student.displayName}? Работы и оценки сохранятся.`)) return;
    const result = await action({ action: "archiveStudent", studentId: student.id });
    if (!result) return; if (selectedStudent === student.id) setSelectedStudent("all"); await load();
  }

  async function remove(student: StudentProfile) {
    if (!window.confirm(`Удалить ${student.displayName} вместе со всеми работами и оценками без возможности восстановления?`)) return;
    const result = await action({ action: "deleteStudent", studentId: student.id });
    if (!result) return; if (selectedStudent === student.id) setSelectedStudent("all"); await load();
  }

  async function copyCode() {
    if (!latestCode) return; await navigator.clipboard.writeText(latestCode.accessCode); setCopied(true);
  }

  const visibleSubmissions = selectedStudent === "all" ? data.submissions : data.submissions.filter((item) => item.studentId === selectedStudent);
  const pending = visibleSubmissions.filter((item) => item.status === "pending").length;
  const studentName = (id: string) => data.students.find((item) => item.id === id)?.displayName || "Ученик";

  if (loading) return <div className="admin-loading"><LoaderCircle className="spin" /> Загружаем класс…</div>;

  return <div className="classroom-admin">
    <aside className="classroom-sidebar">
      <div className="admin-section-head"><div><span className="eyebrow">Класс</span><h1>Ученики</h1></div></div>
      <form className="admin-form" onSubmit={createStudent}><label><span>Имя ученика</span><input className="admin-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Например, Максим П." minLength={2} maxLength={100} required /></label><button type="submit" className="button button-primary" disabled={busy}><Plus size={17} /> Добавить ученика</button></form>
      {latestCode ? <div className="student-code-card"><KeyRound /><div><span>Код для {latestCode.student.displayName}</span><strong>{latestCode.accessCode}</strong><small>Показывается только сейчас. Передайте его ученику лично.</small></div><button type="button" onClick={copyCode} aria-label="Скопировать код">{copied ? <Check /> : <Copy />}</button></div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      <div className="teacher-student-list"><button type="button" className={selectedStudent === "all" ? "active" : ""} onClick={() => setSelectedStudent("all")}><span><UserRound /><strong>Все ученики</strong></span><small>{data.submissions.length} работ</small></button>{data.students.map((student) => { const count = data.submissions.filter((item) => item.studentId === student.id).length; return <article key={student.id} className={!student.active ? "archived" : ""}><button type="button" className={selectedStudent === student.id ? "active" : ""} onClick={() => setSelectedStudent(student.id)}><span><UserRound /><strong>{student.displayName}</strong></span><small>{student.active ? `${count} работ · код ••••${student.codeHint}` : "Доступ закрыт"}</small></button><div className="teacher-student-actions">{student.active ? <><button type="button" onClick={() => regenerate(student)} aria-label={`Обновить код для ${student.displayName}`} title="Новый код"><RefreshCcw size={15} /></button><button type="button" className="danger" onClick={() => archive(student)} aria-label={`Закрыть доступ для ${student.displayName}`} title="Закрыть доступ"><Archive size={15} /></button></> : <button type="button" className="danger" onClick={() => remove(student)} aria-label={`Удалить ${student.displayName} безвозвратно`} title="Удалить навсегда"><Trash2 size={15} /></button>}</div></article>; })}</div>
    </aside>
    <section className="classroom-submissions">
      <div className="classroom-queue-head"><div><span className="eyebrow">Проверка работ</span><h1>{selectedStudent === "all" ? "Все отправленные работы" : studentName(selectedStudent)}</h1><p>{pending ? `${pending} ${pending === 1 ? "работа ожидает" : "работы ожидают"} проверки.` : "Новых работ на проверку нет."}</p></div><button type="button" className="button button-secondary" onClick={() => void load()}><RefreshCcw size={17} /> Обновить</button></div>
      {visibleSubmissions.length ? <div className="teacher-submission-list">{visibleSubmissions.map((submission) => <SubmissionReviewCard key={`${submission.id}-${submission.updatedAt}`} submission={submission} studentName={studentName(submission.studentId)} onSaved={load} />)}</div> : <div className="admin-empty"><ClipboardCheck size={42} /><h3>Работ пока нет</h3><p>Когда ученик отправит ответ из практики, аудиотренажёра или экзамена, он появится здесь.</p></div>}
    </section>
  </div>;
}
