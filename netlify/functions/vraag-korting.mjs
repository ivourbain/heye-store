// ============================================================
//  vraag-korting.mjs  —  Netlify Function (nieuw formaat)
//  Een bezoeker vult in de welkomstbanner zijn e-mailadres in.
//  Deze functie:
//    1. kijkt of dat adres al een welkomstcode kreeg
//    2. maakt anders een nieuwe, unieke code (bv. HEYE-K7QP3M)
//    3. bewaart die (opslag.js) en mailt hem via je Combell-mailbox
//
//  Regels: één code per e-mailadres, één keer te gebruiken, geldig
//  zoveel dagen als korting.geldigDagen in instellingen.js.
//
//  Nodig in Netlify: SMTP_WACHTWOORD (zie _gedeeld/mail.js).
//
//  Dit bestand gebruikt het NIEUWE functieformaat van Netlify
//  ("export default" met een Request erin en een Response eruit).
//  Het oude formaat (exports.handler) wordt in 2027 afgeschaft.
// ============================================================

import { kortingInstellingen, maakCode, datumTekst } from "./_gedeeld/korting.js";
import { opslag, emailHash, vandaag } from "./_gedeeld/opslag.js";
import { leesInstellingen } from "./_gedeeld/instellingen.js";
import { verstuurMail } from "./_gedeeld/mail.js";
import { netteBron } from "./_gedeeld/resultaten.js";
import { startInschrijving, nieuwsbriefInstellingen } from "./_gedeeld/nieuwsbrief.js";

const MAX_VERSTUURD   = 3;     // hoe vaak we dezelfde code opnieuw mailen
const MAX_PER_DAG     = 200;   // nieuwe codes per dag, als rem tegen misbruik
const EMAIL_PATROON   = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

function antwoord(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function euro(bedrag) {
  return "€" + Number(bedrag).toFixed(2).replace(".", ",");
}

// De mail zelf: platte tekst + een eenvoudige opgemaakte versie
function maakMail({ winkel, code, percentage, minimum, geldigTot, link }) {
  const tot = datumTekst(geldigTot);
  const voorwaarden = link.split("/?")[0] + "/voorwaarden.html#korting";
  const voorwaarde = minimum > 0 ? ` op een bestelling vanaf ${euro(minimum)}` : "";
  const tekst =
`Welkom bij ${winkel}!

Bedankt voor je interesse. Hier is je persoonlijke kortingscode:

    ${code}

Je krijgt ${percentage}% korting${voorwaarde}. De code is geldig tot ${tot} en werkt één keer.

Zo gebruik je hem: open je winkelmandje, klik op "Heb je een kortingscode?" en vul de code in.
Of klik op deze link, dan staat de code meteen klaar:
${link}

Veel shopplezier!
${winkel}

Actievoorwaarden: ${voorwaarden}`;

  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#222;line-height:1.5">
  <h2 style="color:#0d47a1;margin:0 0 12px">Welkom bij ${winkel}!</h2>
  <p>Bedankt voor je interesse. Hier is je persoonlijke kortingscode:</p>
  <p style="text-align:center;margin:22px 0">
    <span style="display:inline-block;font-size:26px;font-weight:bold;letter-spacing:2px;border:2px dashed #1565c0;border-radius:10px;padding:12px 22px;color:#0d47a1">${code}</span>
  </p>
  <p>Je krijgt <strong>${percentage}% korting</strong>${voorwaarde}.
     De code is geldig tot <strong>${tot}</strong> en werkt één keer.</p>
  <p style="text-align:center;margin:24px 0">
    <a href="${link}" style="background:#1565c0;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold">Naar de winkel — code staat klaar</a>
  </p>
  <p style="font-size:13px;color:#666">Of open je winkelmandje, klik op "Heb je een kortingscode?" en vul de code in.</p>
  <p>Veel shopplezier!<br>${winkel}</p>
  <p style="font-size:12px;color:#888;margin-top:22px"><a href="${voorwaarden}" style="color:#888">Actievoorwaarden</a></p>
</div>`;
  return { tekst, html };
}

// De welkomstcode zelf (aanmaken / opnieuw sturen). Geeft een Response terug.
async function kortingAanvraag(req, data) {
  // Verborgen veldje: een mens laat het leeg, een spambot vult het in
  if (data.website) return antwoord(200, { ok: true, melding: "Bedankt!" });

  const email = String(data.email || "").trim().slice(0, 100);
  if (!EMAIL_PATROON.test(email)) {
    return antwoord(400, { ok: false, melding: "Dit e-mailadres lijkt niet te kloppen. Kijk je het even na?" });
  }

  let inst;
  try { inst = leesInstellingen(); } catch (e) { inst = {}; }
  const k = kortingInstellingen(inst);
  if (!k.actief || !k.welkom) {
    return antwoord(403, { ok: false, melding: "Er loopt momenteel geen welkomstactie." });
  }

  const winkel = (inst.winkel && inst.winkel.toonnaam) || "Heye Store";
  const van = { naam: winkel, adres: (inst.bedrijf && inst.bedrijf.email) || "info@heyestore.be" };
  const siteUrl = process.env.URL || new URL(req.url).origin;

  const kast = opslag();
  const hash = emailHash(email);
  const emailSleutel = `email/${hash}`;

  try {
    // ---- 1) Kreeg dit adres al een code? ----
    const bestaand = await kast.get(emailSleutel, { type: "json" });
    if (bestaand) {
      const info = await kast.get(`code/${bestaand.code}`, { type: "json" });
      if (info && info.gebruikt) {
        return antwoord(200, { ok: false, melding: "Je hebt je welkomstkorting al gebruikt. Bedankt voor je bestelling!" });
      }
      if (!info || Date.now() > new Date(info.geldigTot).getTime()) {
        const wanneer = datumTekst((info && info.aangemaakt) || bestaand.aangemaakt);
        return antwoord(200, { ok: false, melding: `Dit e-mailadres kreeg al een welkomstcode op ${wanneer}; die is intussen verlopen.` });
      }
      if ((bestaand.verstuurd || 1) >= MAX_VERSTUURD) {
        return antwoord(200, { ok: false, melding: "We stuurden je code al naar dit adres. Kijk ook even bij je ongewenste mail (spam)." });
      }
      // Zelfde code nog eens mailen (mail kwijt of in de spam beland)
      const mail = maakMail({ winkel, code: bestaand.code, percentage: info.percentage || k.percentage,
        minimum: k.minimum, geldigTot: info.geldigTot, link: `${siteUrl}/?code=${bestaand.code}` });
      await verstuurMail({ van, aan: email, onderwerp: `Je welkomstkorting bij ${winkel}`, ...mail });
      await kast.setJSON(emailSleutel, Object.assign({}, bestaand, { verstuurd: (bestaand.verstuurd || 1) + 1 }));
      return antwoord(200, { ok: true, melding: `We stuurden je code opnieuw naar ${email}. Kijk ook even bij je ongewenste mail.` });
    }

    // ---- 2) Rem op het aantal nieuwe codes per dag ----
    const tellerSleutel = `teller/${vandaag()}`;
    const teller = (await kast.get(tellerSleutel, { type: "json" })) || { aantal: 0 };
    if (teller.aantal >= MAX_PER_DAG) {
      return antwoord(429, { ok: false, melding: "Het is vandaag erg druk. Probeer het morgen opnieuw." });
    }

    // ---- 3) Nieuwe unieke code aanmaken en bewaren ----
    const nu = new Date();
    const geldigTot = new Date(nu.getTime() + k.geldigDagen * 24 * 3600 * 1000);
    geldigTot.setUTCHours(21, 59, 59, 0);   // tot het einde van die dag (Belgische tijd)
    const record = { emailHash: hash, aangemaakt: nu.toISOString(), geldigTot: geldigTot.toISOString(),
                     percentage: k.percentage, gebruikt: false, bron: netteBron(data.bron) };

    let code = null;
    for (let poging = 0; poging < 5 && !code; poging++) {
      const kandidaat = maakCode();
      // onlyIfNew: bestaat deze code toevallig al, dan schrijven we niets en proberen we een andere
      const r = await kast.setJSON(`code/${kandidaat}`, record, { onlyIfNew: true });
      if (r && r.modified !== false) code = kandidaat;
    }
    if (!code) return antwoord(500, { ok: false, melding: "Er liep iets mis. Probeer het zo meteen opnieuw." });

    const r2 = await kast.setJSON(emailSleutel, { code, aangemaakt: nu.toISOString(), verstuurd: 1 }, { onlyIfNew: true });
    if (r2 && r2.modified === false) {
      // Op hetzelfde moment al een aanvraag voor dit adres: de nieuwe code weer opruimen
      await kast.delete(`code/${code}`);
      return antwoord(200, { ok: true, melding: `Je code is onderweg naar ${email}.` });
    }

    // ---- 4) Mailen. Lukt dat niet, dan alles weer opruimen zodat je opnieuw kunt proberen ----
    const mail = maakMail({ winkel, code, percentage: k.percentage, minimum: k.minimum,
      geldigTot: record.geldigTot, link: `${siteUrl}/?code=${code}` });
    try {
      await verstuurMail({ van, aan: email, onderwerp: `Je welkomstkorting van ${k.percentage}% bij ${winkel}`, ...mail });
    } catch (e) {
      console.log("Mail versturen mislukt:", e.message);
      await kast.delete(emailSleutel);
      await kast.delete(`code/${code}`);
      return antwoord(502, { ok: false, melding: "De mail kon nu niet verstuurd worden. Probeer het straks opnieuw." });
    }

    teller.aantal += 1;
    await kast.setJSON(tellerSleutel, teller);

    return antwoord(200, { ok: true, melding: `Je code is onderweg naar ${email}! Kijk ook even bij je ongewenste mail als hij er niet meteen is.` });
  } catch (e) {
    console.log("vraag-korting fout:", e.message);
    return antwoord(500, { ok: false, melding: "Er liep iets mis. Probeer het zo meteen opnieuw." });
  }
}

export default async (req) => {
  if (req.method !== "POST") return antwoord(405, { ok: false, melding: "Method not allowed" });

  let data;
  try { data = await req.json(); } catch (e) { return antwoord(400, { ok: false, melding: "Ongeldige gegevens." }); }

  const resultaat = await kortingAanvraag(req, data);

  // ---- Nieuwsbrief: enkel als de klant het vinkje ZELF aanzette ----
  // Los van de korting: ook wie zijn code al gebruikte, mag zich inschrijven.
  // Altijd met dubbele bevestiging (mail met link + knop), zie _gedeeld/nieuwsbrief.js.
  const email = String(data.email || "").trim().slice(0, 100);
  if (data.nieuwsbrief !== true || data.website || !EMAIL_PATROON.test(email)) return resultaat;

  let inst;
  try { inst = leesInstellingen(); } catch (e) { inst = {}; }
  if (!nieuwsbriefInstellingen(inst).actief) return resultaat;

  let extra = "";
  try {
    const winkel = (inst.winkel && inst.winkel.toonnaam) || "Heye Store";
    extra = await startInschrijving({
      email, instellingen: inst, winkel,
      siteUrl: process.env.URL || new URL(req.url).origin,
      van: { naam: winkel, adres: (inst.bedrijf && inst.bedrijf.email) || "info@heyestore.be" }
    });
  } catch (e) {
    console.log("Nieuwsbrief-inschrijving mislukt:", e.message);
    extra = "De inschrijving op de nieuwsbrief lukte nu niet; probeer het later gerust opnieuw.";
  }
  if (!extra) return resultaat;

  const j = await resultaat.json();
  j.melding = ((j.melding || "") + " " + extra).trim();
  j.nieuwsbrief = true;
  return antwoord(resultaat.status, j);
};
