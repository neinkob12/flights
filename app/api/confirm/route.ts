import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "", t = u.searchParams.get("t") ?? "";
  await db().from("watches").update({ email_confirmed: true }).eq("id", id).eq("manage_token", t);
  return NextResponse.redirect(`${appUrl()}/w/${id}?t=${t}&confirmed=1`);
}
