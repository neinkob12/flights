import { setupStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const items = setupStatus();
  return (
    <div className="card stack">
      <h2 style={{ margin: 0 }}>Setup status</h2>
      <p className="note">Which services are connected. Values are never shown.</p>
      {items.map((i) => (
        <div key={i.name} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div><b>{i.name}</b><div className="note">{i.what}</div></div>
          <span className={i.ok ? "pill" : "pill off"}>{i.ok ? "Connected" : "Missing"}</span>
        </div>
      ))}
    </div>
  );
}
