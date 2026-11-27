import { NextResponse } from "next/server";

// Free airport/city autocomplete (no key needed).
export async function GET(req: Request) {
  const term = new URL(req.url).searchParams.get("term")?.trim() ?? "";
  if (term.length < 2) return NextResponse.json([]);
  const q = new URLSearchParams({ term, locale: "en" });
  q.append("types[]", "city");
  q.append("types[]", "airport");
  const res = await fetch(`https://autocomplete.travelpayouts.com/places2?${q}`, { next: { revalidate: 86400 } });
  if (!res.ok) return NextResponse.json([]);
  const raw = (await res.json()) as { code: string; name: string; type: string; country_name: string; city_name?: string }[];
  return NextResponse.json(raw.slice(0, 8).map((p) => ({
    code: p.code,
    label: p.type === "city" ? `${p.name} (all airports), ${p.country_name}` : `${p.name}, ${p.city_name ?? ""} ${p.country_name}`.replace(/\s+/g, " "),
  })));
}
