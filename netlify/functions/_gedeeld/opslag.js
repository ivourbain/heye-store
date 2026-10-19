// ============================================================
//  _gedeeld/opslag.js  —  gedeelde code, GEEN eigen functie
//  De kleine "kast" op Netlify waar de welkomstcodes in liggen
//  (Netlify Blobs, opslag "welkomstkorting").
//
//  Wat ligt erin?
//    code/HEYE-ABC234   { emailHash, aangemaakt, geldigTot, gebruikt, ... }
//    email/<hash>       { code, aangemaakt, verstuurd }
//    teller/2026-10-19  { aantal }   (hoeveel nieuwe codes vandaag)
//  Het e-mailadres zelf bewaren we NIET, enkel een "vingerafdruk" (hash):
//  genoeg om te herkennen of een adres al een code kreeg, maar niet om
//  het adres terug te lezen.
// ============================================================

import crypto from "crypto";
import { getStore } from "@netlify/blobs";

const NAAM = "welkomstkorting";

function opslag() {
  if (globalThis.__testOpslag) return globalThis.__testOpslag;
  // "strong": wat we net schreven, lezen we meteen terug (belangrijk om
  // dubbele codes en dubbel gebruik te vermijden).
  return getStore({ name: NAAM, consistency: "strong" });
}

// Vingerafdruk van een e-mailadres
function emailHash(email) {
  return crypto.createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");
}

// Datum als 2026-10-19 (Belgische tijd)
function vandaag() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
}

export { opslag, emailHash, vandaag };
