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

const { markeerGebruikt } = require("./_gedeeld/korting");
const { sluitAan } = require("./_gedeeld/opslag");

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body || "{}").payload || {};
  } catch (e) {
    return { statusCode: 200, body: "Geen leesbare gegevens" };
  }

  const formulier = payload.form_name || (payload.data || {})["form-name"] || "";
  const d = payload.data || {};
  if (formulier !== "bestelling" || !d.kortingscode) {
    return { statusCode: 200, body: "Niets te doen" };
  }
  // Enkel overschrijvingen. Online bestellingen wachten op Mollie.
  if (!String(d.betaalwijze || "").startsWith("Overschrijving")) {
    return { statusCode: 200, body: "Online bestelling — wacht op Mollie" };
  }

  try {
    sluitAan(event);
    await markeerGebruikt(d.kortingscode, d.bestelnummer, "overschrijving");
  } catch (e) {
    console.log("Kortingscode niet als gebruikt gemarkeerd:", e.message);
  }
  return { statusCode: 200, body: "OK" };
};
