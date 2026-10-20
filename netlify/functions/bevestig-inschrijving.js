// ============================================================
//  bevestig-inschrijving.js  —  Netlify Function (nieuw formaat)
//  nieuwsbrief.html roept dit aan als de klant op "Ja, ik bevestig"
//  klikt. Pas dan komt hij in Resend (zie _gedeeld/nieuwsbrief.js).
//
//  Vraag:    POST { "t": "<code uit de bevestigingslink>" }
//  Antwoord: { ok, status, melding }
// ============================================================

import { bevestigInschrijving } from "./_gedeeld/nieuwsbrief.js";

function antwoord(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export default async (req) => {
  // Enkel POST: een link die alleen geopend wordt (bv. door een virusscanner)
  // mag niemand inschrijven.
  if (req.method !== "POST") return antwoord(405, { ok: false, melding: "Method not allowed" });

  let data;
  try { data = await req.json(); } catch (e) { return antwoord(400, { ok: false, melding: "Ongeldige gegevens." }); }

  try {
    const r = await bevestigInschrijving(data.t);
    return antwoord(200, r);
  } catch (e) {
    console.log("bevestig-inschrijving fout:", e.message);
    return antwoord(502, { ok: false, status: "fout", melding: "Je inschrijving kon nu niet verwerkt worden. Probeer het over enkele minuten opnieuw met dezelfde link." });
  }
};
