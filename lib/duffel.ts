// Duffel booking API, used in TEST mode for the auto-hold demo.
// Test mode returns sandbox airlines (e.g. "Duffel Airways") and never issues real tickets.

const BASE = "https://api.duffel.com";

async function duffel<T>(path: string, body?: unknown): Promise<T> {
  const key = process.env.DUFFEL_TEST_TOKEN ?? "";
  if (!key) throw new Error("The demo is not switched on yet (Duffel test key missing). Check back soon!");
  if (!key.startsWith("duffel_test_")) throw new Error("Demo only runs with a Duffel TEST token (duffel_test_...).");
  const res = await fetch(BASE + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify({ data: body }) : undefined,
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.errors?.map((e: { message: string }) => e.message).join("; ") || res.statusText;
    throw new Error(`Duffel: ${msg}`);
  }
  return json.data as T;
}

type Offer = {
  id: string;
  total_amount: string;
  total_currency: string;
  owner: { name: string; iata_code: string };
  payment_requirements: { requires_instant_payment: boolean; price_guarantee_expires_at: string | null; payment_required_by: string | null };
  slices: { segments: { departing_at: string; arriving_at: string; marketing_carrier_flight_number: string; marketing_carrier: { iata_code: string } }[] }[];
};
type OfferRequest = { offers: Offer[]; passengers: { id: string; type: string }[] };

export type HoldResult =
  | { status: "held"; bookingReference: string; orderId: string; price: string; currency: string; airline: string;
      flight: string; departingAt: string; payBy: string | null; priceGuaranteedUntil: string | null; offersScanned: number }
  | { status: "no_match"; cheapest: { price: string; currency: string; holdable: boolean } | null; offersScanned: number };

export async function snipeAndHold(p: { origin: string; destination: string; date: string; maxPrice: number }): Promise<HoldResult> {
  const req = await duffel<OfferRequest>("/air/offer_requests?return_offers=true&supplier_timeout=20000", {
    slices: [{ origin: p.origin, destination: p.destination, departure_date: p.date }],
    passengers: [{ type: "adult" }],
    cabin_class: "economy",
  });

  const offers = [...req.offers].sort((a, b) => Number(a.total_amount) - Number(b.total_amount));
  const holdable = offers.filter((o) => !o.payment_requirements.requires_instant_payment);
  const match = holdable.find((o) => Number(o.total_amount) <= p.maxPrice);

  if (!match) {
    const c = offers[0];
    return {
      status: "no_match",
      offersScanned: offers.length,
      cheapest: c ? { price: c.total_amount, currency: c.total_currency, holdable: !c.payment_requirements.requires_instant_payment } : null,
    };
  }

  // Demo passenger. In a real product the user saves their own details once.
  const order = await duffel<{ id: string; booking_reference: string; payment_status: { payment_required_by: string | null; price_guarantee_expires_at: string | null } }>(
    "/air/orders",
    {
      type: "hold",
      selected_offers: [match.id],
      passengers: [{
        id: req.passengers[0].id,
        title: "ms",
        gender: "f",
        given_name: "Demo",
        family_name: "Traveller",
        born_on: "1995-06-15",
        email: "demo.traveller@example.com",
        phone_number: "+442080160508",
      }],
    },
  );

  const seg = match.slices[0].segments[0];
  return {
    status: "held",
    bookingReference: order.booking_reference,
    orderId: order.id,
    price: match.total_amount,
    currency: match.total_currency,
    airline: match.owner.name,
    flight: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
    departingAt: seg.departing_at,
    payBy: order.payment_status.payment_required_by,
    priceGuaranteedUntil: order.payment_status.price_guarantee_expires_at,
    offersScanned: offers.length,
  };
}
