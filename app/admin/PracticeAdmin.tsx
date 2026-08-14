"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, BookOpen, Check, Edit3, Layers3, LoaderCircle, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  PRACTICE_LEVELS,
  type PracticeBlock,
  type PracticeExercise,
  type PracticeExerciseInput,
  type PracticeSection,
} from "../practice/types";
import { PracticeSectionsAdmin } from "./PracticeSectionsAdmin";

type FormState = Omit<PracticeExerciseInput, "id">;

function sortExercises(exercises: PracticeExercise[]) {
  return [...exercises].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

const emptyForm: FormState = {
  block: "paragraphs",
  title: "",
  level: "Практика",
  minutes: 10,
  source: "",
  prompt: "",
  model: "",
  published: false,
  archived: false,
  sortOrder: 1,
};

export function PracticeAdmin() {
  const [mode, setMode] = useState<"exercises" | "sections">("exercises");
  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [sections, setSections] = useState<PracticeSection[]>([]);
  const [registryBlock, setRegistryBlock] = useState<PracticeBlock>("paragraphs");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<PracticeExercise | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/practice-exercises", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Не удалось загрузить задания."); return; }
    setExercises(data.exercises);
    setSections(data.sections);
    if (data.sections.length) {
      setRegistryBlock((current) => data.sections.some((section: PracticeSection) => section.id === current) ? current : data.sections[0].id);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  function nextPosition(block: PracticeBlock) {
    const positions = exercises.filter((exercise) => exercise.block === block && !exercise.archived).map((exercise) => exercise.sortOrder);
    return positions.length ? Math.max(...positions) + 1 : 1;
  }

  function resetForm(block: PracticeBlock = form.block) {
    setForm({ ...emptyForm, block, sortOrder: nextPosition(block) });
    setEditing(null);
    setError("");
  }

  function startEdit(item: PracticeExercise) {
    setEditing(item);
    setRegistryBlock(item.block);
    setForm({
      block: item.block,
      title: item.title,
      level: item.level,
      minutes: item.minutes,
      source: item.source,
      prompt: item.prompt,
      model: item.model,
      published: item.archived ? false : item.published,
      archived: item.archived,
      sortOrder: item.sortOrder,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeBlock(block: PracticeBlock) {
    setRegistryBlock(block);
    setForm((current) => editing ? { ...current, block } : { ...current, block, sortOrder: nextPosition(block) });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/practice-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing?.id, archived: false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить задание.");
      const saved = data.exercise as PracticeExercise;
      setMessage(editing?.archived ? "Задание восстановлено." : editing ? "Изменения сохранены." : form.published ? "Задание опубликовано." : "Черновик сохранён.");
      const block = form.block;
      setExercises((current) => sortExercises(current.some((item) => item.id === saved.id)
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]));
      setEditing(null);
      setForm({ ...emptyForm, block, sortOrder: form.sortOrder + 1 });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить задание.");
    } finally {
      setBusy(false);
    }
  }

  async function archive(item: PracticeExercise) {
    if (!window.confirm(`Убрать «${item.title}» в архив? Ученики больше не увидят это задание.`)) return;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch(`/api/admin/practice-exercises?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось убрать задание в архив."); return; }
    const archived = data.exercise as PracticeExercise;
    setExercises((current) => sortExercises(current.map((exercise) => exercise.id === archived.id ? archived : exercise)));
    if (editing?.id === item.id) resetForm(item.block);
    setMessage("Задание перенесено в архив. Его можно восстановить через редактирование.");
  }

  async function remove(item: PracticeExercise) {
    if (!window.confirm(`Удалить «${item.title}» навсегда? Восстановить задание после этого будет невозможно.`)) return;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch(`/api/admin/practice-exercises?id=${encodeURIComponent(item.id)}&permanent=true`, { method: "DELETE" });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось удалить задание."); return; }
    setExercises((current) => current.filter((exercise) => exercise.id !== item.id));
    if (editing?.id === item.id) resetForm(item.block);
    setMessage("Задание удалено навсегда.");
  }

  const visibleRecords = exercises.filter((exercise) => exercise.block === registryBlock);

  if (mode === "sections") return <div><div className="admin-subtabs" role="tablist" aria-label="Управление практикой"><button type="button" role="tab" aria-selected={false} onClick={() => setMode("exercises")}><BookOpen size={17} /> Задания</button><button type="button" role="tab" aria-selected className="active"><Layers3 size={17} /> Направления</button></div><PracticeSectionsAdmin onChanged={() => void load()} /></div>;

  return (
    <div><div className="admin-subtabs" role="tablist" aria-label="Управление практикой"><button type="button" role="tab" aria-selected className="active"><BookOpen size={17} /> Задания</button><button type="button" role="tab" aria-selected={false} onClick={() => setMode("sections")}><Layers3 size={17} /> Направления</button></div><div className="admin-layout practice-admin-layout">
      <section className="admin-editor">
        <div className="admin-section-head">
          <div><span className="eyebrow">{editing ? editing.archived ? "Восстановление" : "Редактирование" : "Новое задание"}</span><h1>{editing ? editing.title : "Добавить практическое задание"}</h1></div>
        </div>
        <form className="admin-form" onSubmit={submit}>
          <div className="admin-form-row practice-admin-row">
            <label><span>Направление *</span><select className="admin-input" value={form.block} onChange={(event) => changeBlock(event.target.value as PracticeBlock)}>{sections.filter((section) => !section.archived).map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>
            <label><span>Название *</span><input className="admin-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={140} required /></label>
          </div>
          <div className="admin-form-row practice-admin-meta-row">
            <label><span>Уровень</span><select className="admin-input" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as FormState["level"] })}>{PRACTICE_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label>
            <label><span>Время, минут</span><input className="admin-input" type="number" min="1" max="120" value={form.minutes} onChange={(event) => setForm({ ...form, minutes: Number(event.target.value) })} required /></label>
            <label><span>Позиция</span><input className="admin-input" type="number" min="1" max="9999" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} required /></label>
          </div>
          <label><span>Исходный текст *</span><textarea className="admin-input admin-source-textarea" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} required /></label>
          <label><span>Что должен сделать ученик *</span><textarea className="admin-input admin-small-textarea" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} required /></label>
          <label><span>Возможный разбор / ориентир *</span><textarea className="admin-input admin-source-textarea" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} required /></label>
          <label className="publish-toggle" htmlFor="practice-published" aria-label="Опубликовать для учеников"><input id="practice-published" type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>Опубликовать для учеников</strong><small>Если выключено, задание останется черновиком и будет видно только в панели автора.</small></span></label>
          {error ? <div className="form-error">{error}</div> : null}
          {message ? <div className="form-success"><Check size={17} /> {message}</div> : null}
          <div className="admin-form-actions">
            <button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : editing?.archived ? <RotateCcw size={18} /> : editing ? <Edit3 size={18} /> : <Plus size={18} />}{editing?.archived ? "Восстановить и сохранить" : editing ? "Сохранить изменения" : "Добавить задание"}</button>
            {editing ? <button type="button" className="button button-secondary" onClick={() => resetForm(editing.block)}>Отменить</button> : null}
          </div>
        </form>
      </section>

      <aside className="admin-registry">
        <div className="admin-registry-head practice-registry-head"><div><span>Реестр практики</span><strong>{exercises.filter((exercise) => !exercise.archived).length} заданий</strong></div><a href="/practice" target="_blank" rel="noreferrer">Открыть практику ↗</a></div>
        <div className="admin-registry-filter">
          <select className="admin-input" value={registryBlock} onChange={(event) => setRegistryBlock(event.target.value as PracticeBlock)} aria-label="Направление в реестре">{sections.map((section) => <option key={section.id} value={section.id}>{section.title}{section.archived ? " · архив" : ""}</option>)}</select>
        </div>
        <div className="admin-records">
          {visibleRecords.map((item) => (
            <article className={`admin-record ${item.archived ? "archived" : ""}`} key={item.id}>
              <div className="admin-record-status"><span className={item.archived ? "archived" : item.published ? "published" : "draft"}>{item.archived ? "Архив" : item.published ? "Опубликовано" : "Черновик"}</span><span>№ {item.sortOrder} · {item.level}</span></div>
              <h3>{item.title}</h3>
              <p className="admin-record-preview">{item.prompt}</p>
              <div className="admin-record-actions"><button type="button" onClick={() => startEdit(item)}>{item.archived ? <RotateCcw size={15} /> : <Edit3 size={15} />} {item.archived ? "Восстановить" : "Изменить"}</button>{item.archived ? <button type="button" className="danger" onClick={() => remove(item)}><Trash2 size={15} /> Удалить навсегда</button> : <button type="button" className="danger" onClick={() => archive(item)}><Archive size={15} /> В архив</button>}</div>
            </article>
          ))}
          {!visibleRecords.length ? <div className="admin-empty"><BookOpen /><p>В этом направлении пока нет заданий.</p></div> : null}
        </div>
      </aside>
    </div></div>
  );
}
