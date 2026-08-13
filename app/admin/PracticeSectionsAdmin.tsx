"use client";

import { useEffect, useState } from "react";
import { Archive, Check, Edit3, LoaderCircle, Plus, RotateCcw } from "lucide-react";
import type { PracticeSection, PracticeSectionInput } from "../practice/types";

const emptyForm: PracticeSectionInput = { title: "", description: "", published: true, archived: false, sortOrder: 1 };

export function PracticeSectionsAdmin({ onChanged }: { onChanged: () => void }) {
  const [sections, setSections] = useState<PracticeSection[]>([]);
  const [form, setForm] = useState<PracticeSectionInput>(emptyForm);
  const [editing, setEditing] = useState<PracticeSection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/practice-sections", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Не удалось загрузить направления."); return; }
    setSections(data.sections);
    setForm((current) => current.title ? current : { ...current, sortOrder: data.sections.filter((item: PracticeSection) => !item.archived).length + 1 });
  }

  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, []);

  function reset() { setEditing(null); setForm({ ...emptyForm, sortOrder: sections.filter((item) => !item.archived).length + 1 }); setError(""); }
  function edit(item: PracticeSection) { setEditing(item); setForm({ id: item.id, title: item.title, description: item.description, published: item.archived ? false : item.published, archived: item.archived, sortOrder: item.sortOrder }); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/admin/practice-sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, id: editing?.id, archived: false }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось сохранить направление."); return; }
    setMessage(editing?.archived ? "Направление восстановлено." : editing ? "Изменения сохранены." : "Направление добавлено."); reset(); await load(); onChanged();
  }

  async function archive(item: PracticeSection) {
    if (!window.confirm(`Убрать направление «${item.title}» в архив? Его задания исчезнут из практики, но сохранятся.`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/practice-sections?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось архивировать направление."); return; }
    setMessage("Направление перенесено в архив."); await load(); onChanged();
  }

  return <div className="admin-layout practice-admin-layout"><section className="admin-editor"><div className="admin-section-head"><div><span className="eyebrow">{editing ? editing.archived ? "Восстановление" : "Редактирование" : "Новое направление"}</span><h1>{editing ? editing.title : "Добавить направление практики"}</h1></div></div><form className="admin-form" onSubmit={submit}><label><span>Название *</span><input className="admin-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label><span>Описание для ученика</span><textarea className="admin-input admin-small-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label><span>Позиция</span><input className="admin-input" type="number" min="1" max="9999" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></label><label className="publish-toggle" aria-label="Показывать направление ученикам"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>Показывать ученикам</strong><small>Черновое направление можно заполнить заданиями до публикации.</small></span></label>{error ? <div className="form-error">{error}</div> : null}{message ? <div className="form-success"><Check size={17} /> {message}</div> : null}<div className="admin-form-actions"><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : editing?.archived ? <RotateCcw size={18} /> : editing ? <Edit3 size={18} /> : <Plus size={18} />}{editing?.archived ? "Восстановить" : editing ? "Сохранить" : "Добавить направление"}</button>{editing ? <button type="button" className="button button-secondary" onClick={reset}>Отменить</button> : null}</div></form></section><aside className="admin-registry"><div className="admin-registry-head"><div><span>Направления</span><strong>{sections.filter((item) => !item.archived).length}</strong></div></div><div className="admin-records">{sections.map((item) => <article className={`admin-record ${item.archived ? "archived" : ""}`} key={item.id}><div className="admin-record-status"><span className={item.archived ? "archived" : item.published ? "published" : "draft"}>{item.archived ? "Архив" : item.published ? "Опубликовано" : "Черновик"}</span><span>№ {item.sortOrder}</span></div><h3>{item.title}</h3><p className="admin-record-preview">{item.description}</p><div className="admin-record-actions"><button type="button" onClick={() => edit(item)}>{item.archived ? <RotateCcw size={15} /> : <Edit3 size={15} />} {item.archived ? "Восстановить" : "Изменить"}</button>{!item.archived ? <button type="button" className="danger" onClick={() => archive(item)}><Archive size={15} /> В архив</button> : null}</div></article>)}</div></aside></div>;
}
