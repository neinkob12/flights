"use client";
import { useState } from "react";

export function ManageButtons({ id, token, active }: { id: string; token: string; active: boolean }) {
  const [busy, setBusy] = useState(false);
  async function act(action: "stop" | "resume") {
    setBusy(true);
    await fetch(`/api/watches/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, action }) });
    location.reload();
  }
  return active
    ? <button className="btn ghost" disabled={busy} onClick={() => act("stop")}>⏸ Pause this watch</button>
    : <button className="btn" disabled={busy} onClick={() => act("resume")}>▶️ Resume watching</button>;
}
