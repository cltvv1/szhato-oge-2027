"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, LoaderCircle, LogOut, MessageSquareText, RotateCcw } from "lucide-react";
import type { StudentProfile, StudentSubmission } from "./types";

function kindLabel(kind: StudentSubmission["kind"]) { return kind === "practice" ? "Практика" : kind === "audio" ? "Аудиотренажёр" : "Экзамен"; }
function statusLabel(status: StudentSubmission["status"]) { return status === "pending" ? "На проверке" : status === "returned" ? "Нужно доработать" : "Проверено"; }

export function StudentDashboard() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/student/submissions", { cache: "no-store" });
    if (response.status === 401) { setStudent(null); setSubmissions([]); setLoading(false); return; }
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Не удалось загрузить результаты."); setLoading(false); return; }
    setStudent(data.student); setSubmissions(data.submissions); setLoading(false);
  }, []);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/student/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось войти."); return; }
    setAccessCode(""); await load();
  }

  async function signOut() { await fetch("/api/student/session", { method: "DELETE" }); setStudent(null); setSubmissions([]); }

  if (loading) return <div className="student-loading"><LoaderCircle className="spin" /> Загружаем кабинет…</div>;
  if (!student) return <section className="student-login-card"><span className="student-login-icon"><GraduationCap /></span><span className="eyebrow">Вход ученика</span><h2>Введи код от учителя</h2><p>Код связывает отправленные работы и оценки с твоим кабинетом. Имя и результаты не публикуются на сайте.</p><form onSubmit={signIn}><label className="field-label" htmlFor="student-code">Персональный код</label><input id="student-code" className="admin-input student-code-input" value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} placeholder="ABCD-2345" autoComplete="one-time-code" required />{error ? <div className="form-error">{error}</div> : null}<button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : null} Войти</button></form></section>;

  const reviewed = submissions.filter((item) => item.status === "reviewed").length;
  const pending = submissions.filter((item) => item.status === "pending").length;
  return <div className="student-results"><div className="student-results-head"><div><span className="eyebrow">Ученик</span><h2>{student.displayName}</h2><p>{submissions.length ? "Здесь собраны все работы, отправленные учителю." : "Отправь первое выполненное задание учителю — оно появится здесь."}</p></div><button type="button" className="button button-secondary" onClick={signOut}><LogOut size={17} /> Выйти</button></div><div className="student-result-stats"><div><Clock3 /><strong>{pending}</strong><span>на проверке</span></div><div><CheckCircle2 /><strong>{reviewed}</strong><span>проверено</span></div><div><MessageSquareText /><strong>{submissions.filter((item) => item.feedback).length}</strong><span>с комментарием</span></div></div>{submissions.length ? <div className="student-submission-list">{submissions.map((item) => <article className={`student-submission-card ${item.status}`} key={item.id}><div className="student-submission-meta"><span>{kindLabel(item.kind)}</span><span>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</span></div><div className="student-submission-title"><div><h3>{item.taskTitle}</h3><span className={`submission-status ${item.status}`}>{statusLabel(item.status)}</span></div>{item.score !== null ? <strong className="submission-score">{item.score} / {item.maxScore}</strong> : null}</div>{item.feedback ? <div className="teacher-feedback"><MessageSquareText size={18} /><div><strong>Комментарий учителя</strong><p>{item.feedback}</p></div></div> : null}{item.status === "returned" ? <Link className="button button-secondary" href={item.kind === "practice" ? "/practice" : item.kind === "audio" ? "/audio" : "/simulator"}><RotateCcw size={17} /> Доработать задание</Link> : null}</article>)}</div> : <div className="student-empty-results"><GraduationCap size={42} /><h3>Пока нет отправленных работ</h3><p>Начни с практики или аудиотренажёра и нажми «Отправить учителю» возле своего ответа.</p><Link className="button button-primary" href="/practice">Перейти к практике <ArrowRight size={17} /></Link></div>}</div>;
}
