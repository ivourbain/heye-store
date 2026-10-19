// ============================================================
//  submission-created.js  —  Netlify Function (automatisch)
//  De NAAM van dit bestand is belangrijk: Netlify roept een functie
//  met de naam "submission-created" zelf aan telkens er een formulier
//  binnenkomt (bestelling, betaling, ...). Niemand anders kan dit adres
//  zomaar gebruiken.
//
//  Wat doet het?
//  Komt er een BESTELLING per OVERSCHRIJVING binnen met een persoonlijke
//  welkomstcode, dan zetten we die code op "gebruikt". Zo kan ze geen
//  tweede keer gebruikt worden.
//  (Bij online betalen gebeurt dat pas als Mollie "betaald" meldt, in
//   mollie-webhook.js — een afgebroken betaling verbruikt de code dus niet.)
// ============================================================

import { markeerGebruikt } from "./_gedeeld/korting.js";

export default async (req) => {
  let payload = {};
  try {
    payload = (await req.json()).payload || {};
  } catch (e) {
    return new Response("Geen leesbare gegevens");
  }

  // Enkel het bestelformulier heeft de velden "kortingscode" en "betaalwijze"
  // (het formulier "betaling" van de Mollie-melding niet).
  const d = payload.data || {};
  if (!d.kortingscode) return new Response("Niets te doen");

  // Enkel overschrijvingen. Online bestellingen wachten op Mollie.
  if (!String(d.betaalwijze || "").startsWith("Overschrijving")) {
    return new Response("Online bestelling — wacht op Mollie");
  }

  try {
    await markeerGebruikt(d.kortingscode, d.bestelnummer, "overschrijving");
  } catch (e) {
    console.log("Kortingscode niet als gebruikt gemarkeerd:", e.message);
  }
  return new Response("OK");
};
