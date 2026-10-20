// ============================================================
//  _gedeeld/beheer.js  —  gedeelde code, GEEN eigen functie
//  Voor functies die enkel beheer.html mag gebruiken
//  (nieuwsbrief-concept, resultaten): wachtwoord + CORS.
//
//  BEHEER_SLEUTEL in Netlify (minstens 20 tekens). Hetzelfde wachtwoord
//  vul je in beheer.html in (tabblad Nieuwsbrief, onderaan).
// ============================================================

import crypto from "crypto";

// beheer.html draait als bestand op je computer (geen website), dus de
// browser vraagt eerst "mag dit?" (CORS). Het wachtwoord beschermt de functie.
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-beheer-sleutel",
  "Access-Control-Max-Age": "86400"
};

export function antwoord(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function zelfde(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// Geeft een Response terug als het verzoek NIET mag doorgaan, anders null.
export async function weigerTenzijBeheer(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return antwoord(405, { ok: false, melding: "Method not allowed" });
  const juist = process.env.BEHEER_SLEUTEL || "";
  if (juist.length < 20) {
    return antwoord(503, { ok: false, melding: "BEHEER_SLEUTEL ontbreekt in Netlify (of is korter dan 20 tekens)." });
  }
  const gegeven = req.headers.get("x-beheer-sleutel") || "";
  if (!gegeven || !zelfde(gegeven, juist)) {
    await new Promise(r => setTimeout(r, 1000));   // raden traag maken
    return antwoord(401, { ok: false, melding: "Het beheerwachtwoord klopt niet." });
  }
  return null;
}
