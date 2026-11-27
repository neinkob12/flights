import { NextResponse } from "next/server";
import { snipeAndHold } from "@/lib/duffel";

export const maxDuration = 60;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const origin = String(b.origin ?? "").toUpperCase(), destination = String(b.destination ?? "").toUpperCase();
  const date = String(b.date ?? ""), maxPrice = Number(b.maxPrice);
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(maxPrice > 0)) {
    return NextResponse.json({ error: "Need origin, destination, date and max price." }, { status: 400 });
  }
  try {
    return NextResponse.json(await snipeAndHold({ origin, destination, date, maxPrice }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
