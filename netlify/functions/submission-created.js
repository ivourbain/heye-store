// ============================================================
//  submission-created.js  —  Netlify Function (automatisch)
//  De NAAM van dit bestand is belangrijk: Netlify roept een functie
//  met de naam "submission-created" zelf aan telkens er een formulier
//  binnenkomt (bestelling, betaling, ...). Niemand anders kan dit adres
//  zomaar gebruiken.
//
//  Wat doet het?
//  Komt er een BESTELLING per OVERSCHRIJVING binnen:
//   - met een persoonlijke welkomstcode: die code op "gebruikt" zetten
//     (zo kan ze geen tweede keer gebruikt worden)
//   - altijd: de bestelling noteren voor het tabblad Resultaten
//     (bestelnummer, bedrag, korting, code — geen persoonsgegevens)
//  (Bij online betalen gebeurt dat pas als Mollie "betaald" meldt, in
//   mollie-webhook.js — een afgebroken betaling verbruikt de code dus niet.)
// ============================================================

import { markeerGebruikt } from "./_gedeeld/korting.js";
import { registreerBestelling } from "./_gedeeld/resultaten.js";

export default async (req) => {
  let payload = {};
  try {
    payload = (await req.json()).payload || {};
  } catch (e) {
    return new Response("Geen leesbare gegevens");
  }

  // Enkel het bestelformulier heeft het veld "betaalwijze"
  // (het formulier "betaling" van de Mollie-melding niet).
  const d = payload.data || {};

  // Enkel overschrijvingen. Online bestellingen wachten op Mollie.
  if (!String(d.betaalwijze || "").startsWith("Overschrijving")) {
    return new Response("Niets te doen (geen overschrijving)");
  }

  if (d.kortingscode) {
    try {
      await markeerGebruikt(d.kortingscode, d.bestelnummer, "overschrijving");
    } catch (e) {
      console.log("Kortingscode niet als gebruikt gemarkeerd:", e.message);
    }
  }

  // Voor het tabblad Resultaten (zonder persoonsgegevens)
  try {
    await registreerBestelling({
      bestelnummer: d.bestelnummer, betaalwijze: "overschrijving",
      totaal: d.totaal, korting: d.kortingbedrag, code: d.kortingscode
    });
  } catch (e) {
    console.log("Bestelling niet geregistreerd:", e.message);
  }
  return new Response("OK");
};
