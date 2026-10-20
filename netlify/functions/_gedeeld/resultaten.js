// ============================================================
//  _gedeeld/resultaten.js  —  gedeelde code, GEEN eigen functie
//  Houdt bij welke bestellingen er binnenkomen, zodat het tabblad
//  "Resultaten" in beheer.html kan tonen wat de promotie oplevert.
//
//  Per bestelling (opslag "welkomstkorting", sleutel bestelling/<nummer>):
//    { datum, betaalwijze, totaal, korting, code }
//  GEEN naam, adres of e-mail: enkel het bestelnummer en de bedragen.
//
//  Wanneer?
//   - online:        als Mollie "betaald" meldt (mollie-webhook.js)
//   - overschrijving: als de bestelling binnenkomt (submission-created.js);
//                     of het geld echt binnenkwam, ziet de webshop niet.
// ============================================================

import { opslag } from "./opslag.js";

// "€38,40" / "38.40" / 38.4 -> 38.4  (onleesbaar -> 0)
export function bedrag(w) {
  if (typeof w === "number") return Number.isFinite(w) ? w : 0;
  const s = String(w || "").replace(/[^\d,.-]/g, "");
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export async function registreerBestelling({ bestelnummer, betaalwijze, totaal, korting, code }) {
  const nr = String(bestelnummer || "").trim().slice(0, 40);
  if (!nr || nr === "(onbekend)") return false;
  // onlyIfNew: Mollie kan dezelfde melding meermaals sturen -> maar één keer tellen
  const r = await opslag().setJSON(`bestelling/${nr}`, {
    datum: new Date().toISOString(),
    betaalwijze: betaalwijze === "online" ? "online" : "overschrijving",
    totaal: bedrag(totaal),
    korting: bedrag(korting),
    code: String(code || "").toUpperCase().slice(0, 40)
  }, { onlyIfNew: true });
  return !(r && r.modified === false);
}
