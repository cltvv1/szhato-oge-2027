"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Check, Edit3, LoaderCircle, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { TheoryLesson, TheoryLessonInput } from "../theory/types";

type FormState = Omit<TheoryLessonInput, "body" | "bullets" | "question"> & {
  bodyText: string;
  bulletsText: string;
  hasQuestion: boolean;
  questionPrompt: string;
  questionOptionsText: string;
  correctOption: number;
  explanation: string;
};

const emptyForm: FormState = {
  short: "", title: "", minutes: 8, intro: "", bodyText: "", bulletsText: "", callout: "", before: "", after: "",
  hasQuestion: false, questionPrompt: "", questionOptionsText: "", correctOption: 1, explanation: "", published: false, archived: false, sortOrder: 1,
};

function lines(value: string) { return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean); }
function sortLessons(items: TheoryLesson[]) { return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)); }

export function TheoryAdmin() {
  const [lessons, setLessons] = useState<TheoryLesson[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<TheoryLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/theory-lessons", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Не удалось загрузить уроки."); return; }
    setLessons(data.lessons);
    setForm((current) => current.title ? current : { ...current, sortOrder: data.lessons.filter((item: TheoryLesson) => !item.archived).length + 1 });
  }, []);

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);

  function resetForm() {
    setEditing(null); setError("");
    setForm({ ...emptyForm, sortOrder: lessons.filter((item) => !item.archived).length + 1 });
  }

  function startEdit(item: TheoryLesson) {
    setEditing(item); setError(""); setMessage("");
    setForm({
      short: item.short, title: item.title, minutes: item.minutes, intro: item.intro, bodyText: item.body.join("\n\n"), bulletsText: item.bullets.join("\n"), callout: item.callout, before: item.before, after: item.after,
      hasQuestion: Boolean(item.question), questionPrompt: item.question?.prompt || "", questionOptionsText: item.question?.options.map((option) => option.text).join("\n") || "", correctOption: Math.max(1, (item.question?.options.findIndex((option) => option.id === item.question?.correctOptionId) ?? 0) + 1), explanation: item.question?.explanation || "",
      published: item.archived ? false : item.published, archived: item.archived, sortOrder: item.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const optionTexts = lines(form.questionOptionsText);
      const options = optionTexts.map((text, index) => ({ id: `option-${index + 1}`, text }));
      const payload: TheoryLessonInput = {
        id: editing?.id, short: form.short, title: form.title, minutes: form.minutes, intro: form.intro,
        body: form.bodyText.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean), bullets: lines(form.bulletsText), callout: form.callout, before: form.before, after: form.after,
        question: form.hasQuestion ? { prompt: form.questionPrompt, options, correctOptionId: options[Math.max(0, form.correctOption - 1)]?.id || "", explanation: form.explanation } : null,
        published: form.published, archived: false, sortOrder: form.sortOrder,
      };
      const response = await fetch("/api/admin/theory-lessons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить урок.");
      const saved = data.lesson as TheoryLesson;
      setLessons((current) => sortLessons(current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]));
      setMessage(editing?.archived ? "Урок восстановлен." : editing ? "Изменения сохранены." : form.published ? "Урок опубликован." : "Черновик сохранён.");
      resetForm();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Не удалось сохранить урок."); }
    finally { setBusy(false); }
  }

  async function archive(item: TheoryLesson) {
    if (!window.confirm(`Убрать урок «${item.title}» в архив?`)) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/admin/theory-lessons?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось архивировать урок."); return; }
    const archived = data.lesson as TheoryLesson;
    setLessons((current) => sortLessons(current.map((lesson) => lesson.id === archived.id ? archived : lesson)));
    if (editing?.id === item.id) resetForm();
    setMessage("Урок перенесён в архив.");
  }

  async function remove(item: TheoryLesson) {
    if (!window.confirm(`Удалить урок «${item.title}» навсегда? Восстановить его после этого будет невозможно.`)) return;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch(`/api/admin/theory-lessons?id=${encodeURIComponent(item.id)}&permanent=true`, { method: "DELETE" });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось удалить урок."); return; }
    setLessons((current) => current.filter((lesson) => lesson.id !== item.id));
    if (editing?.id === item.id) resetForm();
    setMessage("Урок удалён навсегда.");
  }

  return <div className="admin-layout theory-admin-layout">
    <section className="admin-editor"><div className="admin-section-head"><div><span className="eyebrow">{editing ? editing.archived ? "Восстановление" : "Редактирование" : "Новый урок"}</span><h1>{editing ? editing.title : "Добавить урок теории"}</h1></div></div>
      <form className="admin-form" onSubmit={submit}>
        <div className="admin-form-row"><label><span>Короткое название *</span><input className="admin-input" value={form.short} onChange={(event) => setForm({ ...form, short: event.target.value })} required /></label><label><span>Заголовок урока *</span><input className="admin-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label></div>
        <div className="admin-form-row practice-admin-meta-row"><label><span>Время, минут</span><input className="admin-input" type="number" min="1" max="120" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: Number(event.target.value) })} /></label><label><span>Позиция</span><input className="admin-input" type="number" min="1" max="9999" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></label></div>
        <label><span>Вступление *</span><textarea className="admin-input admin-small-textarea" value={form.intro} onChange={(event) => setForm({ ...form, intro: event.target.value })} required /></label>
        <label><span>Основные абзацы * <small>Разделяйте пустой строкой</small></span><textarea className="admin-input admin-source-textarea" value={form.bodyText} onChange={(event) => setForm({ ...form, bodyText: event.target.value })} required /></label>
        <label><span>Список «Запомни» <small>Каждый пункт с новой строки</small></span><textarea className="admin-input admin-small-textarea" value={form.bulletsText} onChange={(event) => setForm({ ...form, bulletsText: event.target.value })} /></label>
        <label><span>Блок «Важно»</span><textarea className="admin-input admin-small-textarea" value={form.callout} onChange={(event) => setForm({ ...form, callout: event.target.value })} /></label>
        <div className="admin-form-row"><label><span>Пример до сжатия</span><textarea className="admin-input admin-small-textarea" value={form.before} onChange={(event) => setForm({ ...form, before: event.target.value })} /></label><label><span>Пример после сжатия</span><textarea className="admin-input admin-small-textarea" value={form.after} onChange={(event) => setForm({ ...form, after: event.target.value })} /></label></div>
        <label className="publish-toggle" aria-label="Добавить тест после урока"><input type="checkbox" checked={form.hasQuestion} onChange={(event) => setForm({ ...form, hasQuestion: event.target.checked })} /><span><strong>Добавить тест после урока</strong><small>Урок будет засчитан после правильного ответа.</small></span></label>
        {form.hasQuestion ? <div className="admin-nested-card"><label><span>Вопрос *</span><textarea className="admin-input admin-small-textarea" value={form.questionPrompt} onChange={(event) => setForm({ ...form, questionPrompt: event.target.value })} required /></label><label><span>Варианты ответа * <small>Каждый с новой строки</small></span><textarea className="admin-input admin-small-textarea" value={form.questionOptionsText} onChange={(event) => setForm({ ...form, questionOptionsText: event.target.value })} required /></label><label><span>Номер правильного варианта</span><input className="admin-input" type="number" min="1" max={Math.max(2, lines(form.questionOptionsText).length)} value={form.correctOption} onChange={(event) => setForm({ ...form, correctOption: Number(event.target.value) })} /></label><label><span>Пояснение после ответа</span><textarea className="admin-input admin-small-textarea" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} /></label></div> : null}
        <label className="publish-toggle" aria-label="Опубликовать урок"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>Опубликовать урок</strong><small>Черновик виден только в панели автора.</small></span></label>
        {error ? <div className="form-error">{error}</div> : null}{message ? <div className="form-success"><Check size={17} /> {message}</div> : null}
        <div className="admin-form-actions"><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : editing?.archived ? <RotateCcw size={18} /> : editing ? <Edit3 size={18} /> : <Plus size={18} />}{editing?.archived ? "Восстановить и сохранить" : editing ? "Сохранить изменения" : "Добавить урок"}</button>{editing ? <button type="button" className="button button-secondary" onClick={resetForm}>Отменить</button> : null}</div>
      </form>
    </section>
    <aside className="admin-registry"><div className="admin-registry-head"><div><span>Уроки теории</span><strong>{lessons.filter((item) => !item.archived).length} уроков</strong></div><a href="/theory" target="_blank" rel="noreferrer">Открыть теорию ↗</a></div><div className="admin-records">{lessons.map((item) => <article className={`admin-record ${item.archived ? "archived" : ""}`} key={item.id}><div className="admin-record-status"><span className={item.archived ? "archived" : item.published ? "published" : "draft"}>{item.archived ? "Архив" : item.published ? "Опубликовано" : "Черновик"}</span><span>№ {item.sortOrder} · {item.minutes} мин</span></div><h3>{item.title}</h3><p className="admin-record-preview">{item.question ? "Есть тест после урока" : "Без теста"}</p><div className="admin-record-actions"><button type="button" onClick={() => startEdit(item)}>{item.archived ? <RotateCcw size={15} /> : <Edit3 size={15} />} {item.archived ? "Восстановить" : "Изменить"}</button>{item.archived ? <button type="button" className="danger" onClick={() => remove(item)}><Trash2 size={15} /> Удалить навсегда</button> : <button type="button" className="danger" onClick={() => archive(item)}><Archive size={15} /> В архив</button>}</div></article>)}</div></aside>
  </div>;
}
