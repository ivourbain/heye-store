// ============================================================
//  _gedeeld/nieuwsbrief.js  —  gedeelde code, GEEN eigen functie
//  Inschrijven op de nieuwsbrief met DUBBELE BEVESTIGING:
//    1. de klant vinkt in het welkomstvakje "nieuws en aanbiedingen" aan
//    2. hij krijgt een mail met een bevestigingslink (startInschrijving)
//    3. die link opent nieuwsbrief.html; pas als hij daar op de knop
//       "Ja, ik bevestig" klikt, komt hij in Resend (bevestigInschrijving)
//  Waarom een knop en niet meteen bij het openen van de link? Sommige
//  mailprogramma's (Outlook, bedrijfsfilters) openen links in mails
//  automatisch om ze op virussen te controleren. Dan zou iemand
//  ingeschreven worden zonder het zelf te weten.
//
//  Bewijs van toestemming (opslag "welkomstkorting"):
//    nieuwsbrief/<hash>    { status, aangevraagd, bevestigd, tekst, ... }
//    inschrijving/<token>  { email, ... }  (tijdelijk, tot bevestigd of verlopen)
//
//  Nodig in Netlify (Environment variables):
//    RESEND_API_KEY     je API-sleutel van Resend, "Full access" (VERPLICHT)
//  Nieuwe inschrijvers komen in Resend in het segment "Nieuwsbrief webshop".
//  Dat segment zoekt de webshop zelf op (of maakt het aan als het nog niet
//  bestaat); je hoeft geen ID op te zoeken. Wil je toch een ander segment:
//    RESEND_SEGMENT_ID    het ID van dat segment, of
//    RESEND_SEGMENT_NAAM  de naam van dat segment
// ============================================================

import crypto from "crypto";
import { opslag, emailHash } from "./opslag.js";
import { verstuurMail } from "./mail.js";

const LINK_GELDIG_DAGEN = 7;
const MAX_BEVESTIGINGSMAILS = 3;

export function nieuwsbriefInstellingen(instellingen) {
  const n = (instellingen && instellingen.nieuwsbrief) || {};
  return {
    actief: n.actief !== false,
    tekst: String(n.tekst || "Ja, stuur me af en toe nieuws en aanbiedingen. Afmelden kan altijd.")
  };
}

function bevestigMail({ winkel, link }) {
  const tekst =
`Hallo,

Je gaf aan dat je af en toe nieuws en aanbiedingen van ${winkel} wilt ontvangen.
Bevestig dat via deze link (geldig ${LINK_GELDIG_DAGEN} dagen):
${link}

Was jij dit niet? Dan hoef je niets te doen: zonder bevestiging sturen we je niets.

${winkel}`;
  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#222;line-height:1.5">
  <h2 style="color:#0d47a1;margin:0 0 12px">Bevestig je inschrijving</h2>
  <p>Je gaf aan dat je af en toe nieuws en aanbiedingen van ${winkel} wilt ontvangen.</p>
  <p style="text-align:center;margin:24px 0">
    <a href="${link}" style="background:#1565c0;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold">Inschrijving bevestigen</a>
  </p>
  <p style="font-size:13px;color:#666">De link is ${LINK_GELDIG_DAGEN} dagen geldig. Was jij dit niet? Dan hoef je niets te doen:
     zonder bevestiging sturen we je niets.</p>
  <p>${winkel}</p>
</div>`;
  return { tekst, html };
}

// Stap 2: bevestigingsmail sturen. Geeft een korte zin terug voor de klant,
// of "" als er niets te melden is (bv. al ingeschreven).
export async function startInschrijving({ email, instellingen, siteUrl, winkel, van }) {
  const nb = nieuwsbriefInstellingen(instellingen);
  if (!nb.actief) return "";

  const kast = opslag();
  const hash = emailHash(email);
  const sleutel = `nieuwsbrief/${hash}`;
  const huidig = await kast.get(sleutel, { type: "json" });

  if (huidig && huidig.status === "bevestigd") return "Je bent al ingeschreven op onze nieuwsbrief.";

  const nu = new Date();
  let token = huidig && huidig.token;
  let tokenInfo = token ? await kast.get(`inschrijving/${token}`, { type: "json" }) : null;
  const tokenGeldig = tokenInfo && Date.now() < new Date(tokenInfo.geldigTot).getTime();

  if (tokenGeldig && (huidig.verstuurd || 1) >= MAX_BEVESTIGINGSMAILS) {
    return "We stuurden je al een bevestigingsmail voor de nieuwsbrief.";
  }
  if (!tokenGeldig) {
    token = crypto.randomBytes(24).toString("hex");
    tokenInfo = {
      email: email,
      emailHash: hash,
      aangevraagd: nu.toISOString(),
      geldigTot: new Date(nu.getTime() + LINK_GELDIG_DAGEN * 24 * 3600 * 1000).toISOString(),
      tekst: nb.tekst
    };
    await kast.setJSON(`inschrijving/${token}`, tokenInfo);
  }

  const mail = bevestigMail({ winkel, link: `${siteUrl}/nieuwsbrief.html?t=${token}` });
  await verstuurMail({ van, aan: email, onderwerp: `Bevestig je inschrijving bij ${winkel}`, ...mail });

  await kast.setJSON(sleutel, {
    status: "wacht",
    aangevraagd: (huidig && huidig.status === "wacht" && tokenGeldig) ? huidig.aangevraagd : tokenInfo.aangevraagd,
    tekst: tokenInfo.tekst,
    token: token,
    verstuurd: tokenGeldig ? (huidig.verstuurd || 1) + 1 : 1
  });
  return "Bevestig ook je inschrijving op de nieuwsbrief via de tweede mail die we je stuurden.";
}

// Het ID van het segment voor de webshop-inschrijvers. Volgorde:
//  1) RESEND_SEGMENT_ID uit Netlify
//  2) eerder gevonden ID (onthouden in de opslag)
//  3) opzoeken op naam in Resend, en anders aanmaken
// Lukt het niet, dan "" : het contact komt dan gewoon zonder segment in Resend.
export async function segmentId(sleutel) {
  if (process.env.RESEND_SEGMENT_ID) return process.env.RESEND_SEGMENT_ID;
  const naam = process.env.RESEND_SEGMENT_NAAM || "Nieuwsbrief webshop";
  const kast = opslag();
  const onthouden = await kast.get("instelling/resend-segment", { type: "json" }).catch(() => null);
  if (onthouden && onthouden.naam === naam && onthouden.id) return onthouden.id;

  try {
    const kop = { "Authorization": `Bearer ${sleutel}` };
    let id = "";
    const lijst = await fetch("https://api.resend.com/segments", { headers: kop });
    if (lijst.ok) {
      const j = await lijst.json();
      const gevonden = (j.data || []).find(s => String(s.name).trim().toLowerCase() === naam.toLowerCase());
      if (gevonden) id = gevonden.id;
    }
    if (!id) {
      const nieuw = await fetch("https://api.resend.com/segments", {
        method: "POST", headers: { ...kop, "Content-Type": "application/json" }, body: JSON.stringify({ name: naam })
      });
      if (nieuw.ok) id = (await nieuw.json()).id || "";
    }
    if (id) await kast.setJSON("instelling/resend-segment", { naam, id });
    return id;
  } catch (e) {
    console.log("Segment niet gevonden/aangemaakt:", e.message);
    return "";
  }
}

// Contact in Resend zetten (of terug op "ingeschreven" als het al bestond)
async function voegToeAanResend(email) {
  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) throw new Error("RESEND_API_KEY ontbreekt in Netlify");
  const segment = await segmentId(sleutel);
  const kop = { "Authorization": `Bearer ${sleutel}`, "Content-Type": "application/json" };

  const r = await fetch("https://api.resend.com/contacts", {
    method: "POST", headers: kop,
    body: JSON.stringify({ email, unsubscribed: false, ...(segment ? { segments: [{ id: segment }] } : {}) })
  });
  if (r.ok) return;

  // Bestaat het contact al? Dan zetten we het (opnieuw) op ingeschreven.
  const fout1 = await r.text().catch(() => "");
  const r2 = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    method: "PATCH", headers: kop, body: JSON.stringify({ unsubscribed: false })
  });
  if (!r2.ok) {
    const fout2 = await r2.text().catch(() => "");
    throw new Error(`Resend weigerde (${r.status}: ${fout1.slice(0, 120)} / ${r2.status}: ${fout2.slice(0, 120)})`);
  }
  if (segment) {
    await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segment)}`, {
      method: "POST", headers: { "Authorization": `Bearer ${sleutel}` }
    }).catch(() => {});
  }
}

// Stap 3: de klant klikte op "Ja, ik bevestig"
export async function bevestigInschrijving(token) {
  if (!/^[a-f0-9]{48}$/.test(String(token || ""))) {
    return { ok: false, status: "ongeldig", melding: "Deze bevestigingslink is niet geldig." };
  }
  const kast = opslag();
  const info = await kast.get(`inschrijving/${token}`, { type: "json" });
  if (!info) {
    return { ok: false, status: "onbekend", melding: "Deze link is al gebruikt of bestaat niet (meer). Ben je al ingeschreven? Dan is alles in orde." };
  }
  if (Date.now() > new Date(info.geldigTot).getTime()) {
    await kast.delete(`inschrijving/${token}`);
    return { ok: false, status: "verlopen", melding: "Deze bevestigingslink is verlopen. Vraag gerust opnieuw een inschrijving aan in de winkel." };
  }

  await voegToeAanResend(info.email);   // gooit een fout als Resend niet meewil -> link blijft bruikbaar

  // Bewijs van toestemming bewaren (zonder het e-mailadres zelf)
  await kast.setJSON(`nieuwsbrief/${info.emailHash}`, {
    status: "bevestigd",
    aangevraagd: info.aangevraagd,
    bevestigd: new Date().toISOString(),
    tekst: info.tekst,
    bron: "welkomstvak webshop, dubbele bevestiging"
  });
  await kast.delete(`inschrijving/${token}`);
  return { ok: true, status: "bevestigd", melding: "Bedankt! Je bent ingeschreven op onze nieuwsbrief. Afmelden kan altijd via de link onderaan elke mail." };
}
