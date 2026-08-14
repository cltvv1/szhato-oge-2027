"use client";

import Link from "next/link";
import { Check, LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import type { SubmissionKind } from "../student/types";

export function SubmitForReviewButton({ kind, taskId, answer, notes = "" }: { kind: SubmissionKind; taskId: string; answer: string; notes?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "login">("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (!answer.trim()) return;
    setState("busy"); setError("");
    const response = await fetch("/api/student/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, taskId, answer, notes }) });
    const data = await response.json();
    if (response.status === 401) { setState("login"); return; }
    if (!response.ok) { setState("idle"); setError(data.error || "Не удалось отправить работу."); return; }
    setState("sent");
  }

  return <span className="review-submit-wrap">
    <button type="button" className="button button-secondary" disabled={!answer.trim() || state === "busy" || state === "sent"} onClick={submit}>
      {state === "busy" ? <LoaderCircle className="spin" size={17} /> : state === "sent" ? <Check size={17} /> : <Send size={17} />}
      {state === "sent" ? "Отправлено учителю" : "Отправить учителю"}
    </button>
    {state === "login" ? <small className="review-login-note">Сначала <Link href="/student">войди по коду ученика</Link>.</small> : null}
    {error ? <small className="review-error-note">{error}</small> : null}
  </span>;
}
