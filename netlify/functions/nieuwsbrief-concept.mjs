// ============================================================
//  nieuwsbrief-concept.mjs  —  Netlify Function (nieuw formaat)
//  Het tabblad "Nieuwsbrief" in beheer.html stuurt hierheen een
//  kant-en-klare nieuwsbrief. Deze functie zet ze als CONCEPT in
//  Resend (Broadcasts), klaar voor het segment "Nieuwsbrief webshop".
//  Er wordt hier NIETS verstuurd: dat doe je zelf in Resend, na het
//  nakijken en een testmail.
//
//  Beveiliging: enkel wie het beheerwachtwoord kent, mag dit gebruiken.
//    BEHEER_SLEUTEL   in Netlify (Environment variables), minstens
//                     20 tekens. Hetzelfde wachtwoord vul je één keer
//                     in, in beheer.html (tabblad Nieuwsbrief).
//  Verder nodig: RESEND_API_KEY (staat er al).
//
//  Vraag:    POST, kop "x-beheer-sleutel", body { onderwerp, naam, html }
//  Antwoord: { ok, id, melding }
// ============================================================

import { segmentId } from "./_gedeeld/nieuwsbrief.js";
import { leesInstellingen } from "./_gedeeld/instellingen.js";
import { antwoord, weigerTenzijBeheer } from "./_gedeeld/beheer.js";

const AFMELDEN = "{{{RESEND_UNSUBSCRIBE_URL}}}";

export default async (req) => {
  const geweigerd = await weigerTenzijBeheer(req);   // wachtwoord + CORS (_gedeeld/beheer.js)
  if (geweigerd) return geweigerd;

  const sleutel = process.env.RESEND_API_KEY;
  if (!sleutel) return antwoord(503, { ok: false, melding: "RESEND_API_KEY ontbreekt in Netlify." });

  let data;
  try { data = await req.json(); } catch (e) { return antwoord(400, { ok: false, melding: "Ongeldige gegevens." }); }

  const onderwerp = String(data.onderwerp || "").trim().slice(0, 150);
  const naam = String(data.naam || onderwerp).trim().slice(0, 100);
  let html = String(data.html || "");
  if (!onderwerp) return antwoord(400, { ok: false, melding: "Het onderwerp ontbreekt." });
  if (html.length < 50) return antwoord(400, { ok: false, melding: "De nieuwsbrief is leeg." });
  if (html.length > 400000) return antwoord(400, { ok: false, melding: "De nieuwsbrief is te groot." });

  // Afmeldlink is verplicht: ontbreekt ze toch, dan zetten we ze er zelf onder.
  if (!html.includes(AFMELDEN)) {
    const voet = `<p style="font-family:Arial,sans-serif;font-size:12px;color:#888;text-align:center;margin:24px 0">` +
      `<a href="${AFMELDEN}" style="color:#888">Afmelden voor deze nieuwsbrief</a></p>`;
    html = html.includes("</body>") ? html.replace("</body>", voet + "</body>") : html + voet;
  }

  let inst = {};
  try { inst = leesInstellingen(); } catch (e) { /* standaardwaarden */ }
  const winkel = (inst.winkel && inst.winkel.toonnaam) || "Heye Store";
  const afzender = ((inst.nieuwsbrief && inst.nieuwsbrief.afzender) || "nieuws@send.heyestore.be").trim();
  const antwoordAdres = (inst.bedrijf && inst.bedrijf.email) || "";

  const segment = await segmentId(sleutel);
  if (!segment) return antwoord(502, { ok: false, melding: "Het segment in Resend kon niet gevonden of aangemaakt worden." });

  try {
    const r = await fetch("https://api.resend.com/broadcasts", {
      method: "POST",
      headers: { "Authorization": `Bearer ${sleutel}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        segment_id: segment,
        from: `${winkel} <${afzender}>`,
        ...(antwoordAdres ? { reply_to: antwoordAdres } : {}),
        subject: onderwerp,
        name: naam,
        html: html,
        send: false            // CONCEPT: versturen doe je zelf in Resend
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.log("Resend weigerde het concept:", r.status, JSON.stringify(j).slice(0, 300));
      return antwoord(502, { ok: false, melding: `Resend weigerde het concept: ${j.message || r.status}` });
    }
    return antwoord(200, { ok: true, id: j.id, melding: "Het concept staat klaar in Resend, bij Broadcasts." });
  } catch (e) {
    return antwoord(502, { ok: false, melding: "Kon Resend niet bereiken. Probeer het straks opnieuw." });
  }
};
