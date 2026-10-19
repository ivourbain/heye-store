// ============================================================
//  _gedeeld/instellingen.js  —  gedeelde code, GEEN eigen functie
//  Leest instellingen.js in op de server (dezelfde manier als
//  create-payment.js). Wordt gebruikt door check-korting.js.
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HIER = path.dirname(fileURLToPath(import.meta.url));

let cache = null;

export function leesInstellingen() {
  if (cache) return cache;

  const kandidaten = [
    path.join(process.cwd(), "instellingen.js"),
    path.join(HIER, "instellingen.js"),
    path.join(HIER, "..", "instellingen.js"),
    path.join(HIER, "..", "..", "instellingen.js"),
    path.join(HIER, "..", "..", "..", "instellingen.js"),
    "/var/task/instellingen.js"
  ];

  for (const bestand of kandidaten) {
    try {
      const tekst = fs.readFileSync(bestand, "utf8");
      const merk  = tekst.indexOf("const INSTELLINGEN");
      if (merk < 0) continue;
      const start = tekst.indexOf("{", merk);
      const eind  = tekst.lastIndexOf("}");
      if (start < 0 || eind < start) continue;
      cache = JSON.parse(tekst.slice(start, eind + 1));
      return cache;
    } catch (e) {
      // dit pad werkte niet, probeer het volgende
    }
  }
  throw new Error("instellingen.js niet gevonden of onleesbaar op de server");
}

