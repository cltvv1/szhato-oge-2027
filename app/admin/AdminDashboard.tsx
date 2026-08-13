"use client";

import { useCallback, useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { BookOpen, Check, Edit3, Headphones, LoaderCircle, LogOut, Plus, Trash2, UploadCloud } from "lucide-react";
import { AUDIO_DIFFICULTIES, type AudioExercise, type AudioExerciseInput } from "../audio/types";
import { PracticeAdmin } from "./PracticeAdmin";

type FormState = {
  title: string;
  description: string;
  sourceText: string;
  sourceName: string;
  difficulty: AudioExerciseInput["difficulty"];
  published: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  sourceText: "",
  sourceName: "",
  difficulty: "Средний",
  published: false,
};

async function audioDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const element = document.createElement("audio");
    const url = URL.createObjectURL(file);
    const finish = (value: number | null) => { URL.revokeObjectURL(url); resolve(value); };
    element.onloadedmetadata = () => finish(Number.isFinite(element.duration) ? Math.round(element.duration) : null);
    element.onerror = () => finish(null);
    element.src = url;
  });
}

function safeFileName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "mp3";
  const base = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "") || "audio";
  return `audio-exercises/files/${base}.${extension}`;
}

export function AdminDashboard() {
  const [section, setSection] = useState<"audio" | "practice">("audio");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [exercises, setExercises] = useState<AudioExercise[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<AudioExercise | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/exercises", { cache: "no-store" });
    if (response.status === 401) { setAuthenticated(false); return; }
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Не удалось загрузить каталог."); return; }
    setAuthenticated(true);
    setExercises(data.exercises);
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось войти."); return; }
    setPassword(""); await load();
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false); setExercises([]); setSection("audio"); resetForm();
  }

  function resetForm() {
    setForm(emptyForm); setEditing(null); setFile(null); setUploadPercent(0); setError("");
  }

  function startEdit(item: AudioExercise) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, sourceText: item.sourceText, sourceName: item.sourceName, difficulty: item.difficulty, published: item.published });
    setFile(null); setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing && !file) { setError("Выберите аудиофайл."); return; }
    setBusy(true); setError(""); setMessage(""); setUploadPercent(0);

    try {
      let audio = editing ? {
        audioUrl: editing.audioUrl,
        audioPathname: editing.audioPathname,
        audioSize: editing.audioSize,
        audioContentType: editing.audioContentType,
        durationSeconds: editing.durationSeconds,
      } : null;

      if (file) {
        if (!file.type.startsWith("audio/")) throw new Error("Выберите аудиофайл MP3, M4A, WAV, OGG или WebM.");
        const blob = await upload(safeFileName(file.name), file, {
          access: "public",
          handleUploadUrl: "/api/admin/audio/upload",
          clientPayload: JSON.stringify({ contentType: file.type, size: file.size }),
          multipart: file.size > 4 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setUploadPercent(Math.round(percentage)),
        });
        audio = {
          audioUrl: blob.url,
          audioPathname: blob.pathname,
          audioSize: file.size,
          audioContentType: file.type,
          durationSeconds: await audioDuration(file),
        };
      }

      const response = await fetch("/api/admin/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...audio, id: editing?.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить упражнение.");
      setMessage(editing ? "Изменения сохранены." : form.published ? "Упражнение опубликовано." : "Черновик сохранён.");
      resetForm();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить упражнение.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: AudioExercise) {
    if (!window.confirm(`Удалить «${item.title}» вместе с аудиофайлом?`)) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/admin/exercises?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setError(data.error || "Не удалось удалить упражнение."); return; }
    if (editing?.id === item.id) resetForm();
    setMessage("Упражнение удалено."); await load();
  }

  if (authenticated === null) return <div className="admin-loading"><LoaderCircle className="spin" /> Проверяем доступ…</div>;

  if (!authenticated) {
    return (
      <div className="admin-login-card">
        <span className="admin-login-icon"><Headphones /></span>
        <span className="eyebrow">Панель автора</span>
        <h1>Вход в панель автора</h1>
        <p>Здесь Анна может управлять практическими заданиями и аудиозаписями, сохранять черновики и публиковать материалы для учеников.</p>
        <form onSubmit={signIn}>
          <label className="field-label" htmlFor="admin-password">Пароль администратора</label>
          <input id="admin-password" className="admin-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error ? <div className="form-error">{error}</div> : null}
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : null} Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-workspace">
      <div className="admin-workspace-nav">
        <div className="admin-content-tabs" role="tablist" aria-label="Разделы панели автора">
          <button type="button" role="tab" aria-selected={section === "audio"} className={section === "audio" ? "active" : ""} onClick={() => setSection("audio")}><Headphones size={18} /> Аудиоупражнения</button>
          <button type="button" role="tab" aria-selected={section === "practice"} className={section === "practice" ? "active" : ""} onClick={() => setSection("practice")}><BookOpen size={18} /> Практические задания</button>
        </div>
        <button type="button" className="button button-secondary" onClick={signOut}><LogOut size={17} /> Выйти</button>
      </div>
      {section === "practice" ? <PracticeAdmin /> : <div className="admin-layout">
      <section className="admin-editor">
        <div className="admin-section-head">
          <div><span className="eyebrow">{editing ? "Редактирование" : "Новое упражнение"}</span><h1>{editing ? editing.title : "Добавить текст и аудио"}</h1></div>
        </div>
        <form className="admin-form" onSubmit={submit}>
          <label><span>Название *</span><input className="admin-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={140} required /></label>
          <div className="admin-form-row">
            <label><span>Уровень</span><select className="admin-input" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as FormState["difficulty"] })}>{AUDIO_DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Источник / автор текста</span><input className="admin-input" value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} placeholder="Для проверки прав и подписи" /></label>
          </div>
          <label><span>Короткое описание</span><textarea className="admin-input admin-small-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Что тренирует этот вариант" /></label>
          <label><span>Исходный текст *</span><textarea className="admin-input admin-source-textarea" value={form.sourceText} onChange={(event) => setForm({ ...form, sourceText: event.target.value })} required /></label>
          <label className="audio-drop">
            <UploadCloud size={30} />
            <strong>{file ? file.name : editing ? "Заменить аудиозапись" : "Выбрать аудиозапись *"}</strong>
            <span>MP3, M4A, WAV, OGG или WebM · до 100 МБ</span>
            <input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,audio/webm,.mp3,.m4a,.wav,.ogg,.webm" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          {editing && !file ? <div className="current-audio">{/* The full source transcript is stored beside every recording. */}<audio controls src={editing.audioUrl} aria-label={`Текущая аудиозапись: ${editing.title}`} />{/* eslint-disable-line jsx-a11y/media-has-caption */}<span>Текущая запись сохранится, если не выбрать новую.</span></div> : null}
          <label className="publish-toggle" htmlFor="exercise-published" aria-label="Опубликовать для учеников"><input id="exercise-published" type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>Опубликовать для учеников</strong><small>Если выключено, упражнение останется черновиком и будет видно только здесь.</small></span></label>
          {uploadPercent > 0 && uploadPercent < 100 ? <div className="upload-progress"><span style={{ width: `${uploadPercent}%` }} /><strong>{uploadPercent}%</strong></div> : null}
          {error ? <div className="form-error">{error}</div> : null}
          {message ? <div className="form-success"><Check size={17} /> {message}</div> : null}
          <div className="admin-form-actions">
            <button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : editing ? <Edit3 size={18} /> : <Plus size={18} />}{editing ? "Сохранить изменения" : "Добавить упражнение"}</button>
            {editing ? <button type="button" className="button button-secondary" onClick={resetForm}>Отменить</button> : null}
          </div>
        </form>
      </section>

      <aside className="admin-registry">
        <div className="admin-registry-head"><div><span>Реестр</span><strong>{exercises.length} упражнений</strong></div><a href="/audio" target="_blank" rel="noreferrer">Открыть каталог ↗</a></div>
        <div className="admin-records">
          {exercises.length ? exercises.map((item) => (
            <article className="admin-record" key={item.id}>
              <div className="admin-record-status"><span className={item.published ? "published" : "draft"}>{item.published ? "Опубликовано" : "Черновик"}</span><span>{item.difficulty}</span></div>
              <h3>{item.title}</h3>
              {/* Every recording has a complete source transcript in its exercise record. */}
              <audio controls preload="none" src={item.audioUrl} aria-label={`Аудиозапись: ${item.title}`} />{/* eslint-disable-line jsx-a11y/media-has-caption */}
              <div className="admin-record-actions"><button type="button" onClick={() => startEdit(item)}><Edit3 size={15} /> Изменить</button><button type="button" className="danger" onClick={() => remove(item)}><Trash2 size={15} /> Удалить</button></div>
            </article>
          )) : <div className="admin-empty"><Headphones /><p>Здесь появятся загруженные упражнения.</p></div>}
        </div>
      </aside>
      </div>}
    </div>
  );
}
