import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST { t, action: "stop" | "resume" }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, action } = await req.json().catch(() => ({}));
  if (!t || !["stop", "resume"].includes(action)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { data, error } = await db().from("watches").update({ active: action === "resume" })
    .eq("id", id).eq("manage_token", t).select("id, active").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
