// ============================================================
//  resultaten.mjs  —  Netlify Function (nieuw formaat)
//  Het tabblad "Resultaten" in beheer.html haalt hier de cijfers op:
//   - welkomstcodes: aangevraagd, gebruikt, verlopen, nog geldig
//   - bestellingen: aantal, omzet, met/zonder kortingscode, per code
//   - nieuwsbrief: bevestigde inschrijvingen (en hoeveel er in Resend
//     actief of afgemeld zijn)
//   - alles ook per week (laatste 8 weken)
//  Er gaan GEEN e-mailadressen of namen naar beheer.html: enkel aantallen,
//  bedragen en bestelnummers.
//
//  Beveiligd met BEHEER_SLEUTEL (zie _gedeeld/beheer.js).
// ============================================================

import { opslag } from "./_gedeeld/opslag.js";
import { segmentId } from "./_gedeeld/nieuwsbrief.js";
import { antwoord, weigerTenzijBeheer } from "./_gedeeld/beheer.js";

const WEKEN = 8;

// Alles onder een voorvoegsel ophalen (in groepjes, niet allemaal tegelijk)
async function alles(kast, prefix) {
  const r = await kast.list({ prefix });
  const sleutels = (r && r.blobs ? r.blobs : []).map(b => b.key);
  const uit = [];
  for (let i = 0; i < sleutels.length; i += 20) {
    const stuk = await Promise.all(sleutels.slice(i, i + 20).map(async k => {
      try { return { sleutel: k, ...(await kast.get(k, { type: "json" })) }; } catch (e) { return null; }
    }));
    uit.push(...stuk.filter(Boolean));
  }
  return uit;
}

// Maandag (Belgische tijd) van de week waarin een moment valt, als "2026-10-19"
function weekVan(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const dag = d.toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });           // 2026-10-21
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    .indexOf(d.toLocaleDateString("en-US", { timeZone: "Europe/Brussels", weekday: "short" }));
  const m = new Date(dag + "T12:00:00Z");
  m.setUTCDate(m.getUTCDate() - Math.max(0, wd));
  return m.toISOString().slice(0, 10);
}

const c = n => Math.round(n * 100) / 100;

// Hoeveel inschrijvers staan er in Resend (actief / afgemeld)? null als dat niet lukt.
async function resendTelling() {
  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) return null;
  try {
    const segment = await segmentId(sleutel);
    if (!segment) return null;
    let actief = 0, afgemeld = 0, na = "";
    for (let pagina = 0; pagina < 30; pagina++) {
      const url = `https://api.resend.com/contacts?segment_id=${encodeURIComponent(segment)}&limit=100${na ? `&after=${encodeURIComponent(na)}` : ""}`;
      const r = await fetch(url, { headers: { "Authorization": `Bearer ${sleutel}` } });
      if (!r.ok) return null;
      const j = await r.json();
      const lijst = j.data || [];
      lijst.forEach(x => (x.unsubscribed ? afgemeld++ : actief++));
      if (!j.has_more || !lijst.length) break;
      na = lijst[lijst.length - 1].id;
    }
    return { actief, afgemeld };
  } catch (e) {
    return null;
  }
}

export default async (req) => {
  const geweigerd = await weigerTenzijBeheer(req);
  if (geweigerd) return geweigerd;

  try {
    const kast = opslag();
    const nu = Date.now();
    const [codes, bestellingen, nieuwsbrief, resend] = await Promise.all([
      alles(kast, "code/"), alles(kast, "bestelling/"), alles(kast, "nieuwsbrief/"), resendTelling()
    ]);

    // ---- weken klaarzetten (oudste eerst) ----
    const deze = weekVan(new Date().toISOString());
    const weken = [];
    for (let i = WEKEN - 1; i >= 0; i--) {
      const d = new Date(deze + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 7 * i);
      weken.push({ week: d.toISOString().slice(0, 10), codes: 0, codesGebruikt: 0, bestellingen: 0, metCode: 0, omzet: 0, inschrijvers: 0 });
    }
    const wk = iso => weken.find(w => w.week === weekVan(iso));

    // ---- welkomstcodes ----
    const welkom = { aangevraagd: codes.length, gebruikt: 0, verlopen: 0, lopend: 0 };
    codes.forEach(x => {
      if (x.gebruikt) welkom.gebruikt++;
      else if (nu > new Date(x.geldigTot).getTime()) welkom.verlopen++;
      else welkom.lopend++;
      const a = wk(x.aangemaakt); if (a) a.codes++;
      if (x.gebruikt) { const g = wk(x.gebruiktOp); if (g) g.codesGebruikt++; }
    });

    // ---- bestellingen ----
    const best = { aantal: bestellingen.length, omzet: 0, metCode: 0, korting: 0, omzetMetCode: 0, online: 0, overschrijving: 0, sinds: null };
    const perCode = {};
    bestellingen.forEach(x => {
      best.omzet += x.totaal || 0;
      if (x.betaalwijze === "online") best.online++; else best.overschrijving++;
      if (!best.sinds || x.datum < best.sinds) best.sinds = x.datum;
      const w = wk(x.datum);
      if (w) { w.bestellingen++; w.omzet = c(w.omzet + (x.totaal || 0)); }
      if (x.code) {
        best.metCode++; best.korting += x.korting || 0; best.omzetMetCode += x.totaal || 0;
        if (w) w.metCode++;
        const sleutel = /^HEYE-[A-Z0-9]{6}$/.test(x.code) ? "Persoonlijke welkomstcodes" : x.code;
        const p = (perCode[sleutel] = perCode[sleutel] || { code: sleutel, aantal: 0, korting: 0, omzet: 0 });
        p.aantal++; p.korting = c(p.korting + (x.korting || 0)); p.omzet = c(p.omzet + (x.totaal || 0));
      }
    });
    best.omzet = c(best.omzet); best.korting = c(best.korting); best.omzetMetCode = c(best.omzetMetCode);

    // ---- nieuwsbrief ----
    const nb = { bevestigd: 0, wacht: 0, resend };
    nieuwsbrief.forEach(x => {
      if (x.status === "bevestigd") { nb.bevestigd++; const w = wk(x.bevestigd); if (w) w.inschrijvers++; }
      else if (x.status === "wacht") nb.wacht++;
    });

    // ---- laatste bestellingen (zonder persoonsgegevens) ----
    const recent = bestellingen.sort((a, b) => String(b.datum).localeCompare(String(a.datum))).slice(0, 15)
      .map(x => ({ nummer: x.sleutel.replace(/^bestelling\//, ""), datum: x.datum, betaalwijze: x.betaalwijze,
                   totaal: x.totaal || 0, korting: x.korting || 0, code: x.code || "" }));

    return antwoord(200, {
      ok: true, gemaakt: new Date().toISOString(),
      welkom, bestellingen: best, perCode: Object.values(perCode).sort((a, b) => b.aantal - a.aantal),
      nieuwsbrief: nb, weken, recent
    });
  } catch (e) {
    console.log("resultaten fout:", e.message);
    return antwoord(500, { ok: false, melding: "De resultaten konden nu niet berekend worden." });
  }
};
