// ============================================================
//  mollie-webhook.js  —  Netlify Function
//  Mollie roept dit adres zelf aan zodra de status van een betaling
//  verandert (betaald, mislukt, geannuleerd, verlopen).
//
//  Wat doet het?
//   1. Mollie stuurt enkel het betaal-id mee (id=tr_xxxxx). We geloven
//      dat niet blindelings: we vragen de echte status zelf op bij Mollie,
//      met onze geheime sleutel. Zo kan niemand een valse "betaald"
//      melding sturen.
//   2. Is de betaling afgerond (betaald, of definitief niet betaald), dan
//      sturen we het formulier "betaling" in bij Netlify. Netlify mailt
//      dat naar jou, net zoals een bestelling: "BETAALD ✓" of "NIET BETAALD".
//
//  Nodig in Netlify:
//   - MOLLIE_API_KEY (staat er al)
//   - Forms -> een e-mailmelding voor het formulier "betaling"
//     (of één melding voor alle formulieren)
//  Het formulier "betaling" zelf staat verborgen onderaan index.html,
//  zodat Netlify het kent.
// ============================================================

// Statussen waar Mollie niet meer van terugkomt. "open" en "pending" negeren we:
// dan is de klant nog bezig, en Mollie roept ons later opnieuw aan.
const AFGEROND = {
  paid:     "BETAALD ✓ — mag verzonden worden",
  failed:   "NIET BETAALD — betaling mislukt",
  canceled: "NIET BETAALD — geannuleerd door de klant",
  expired:  "NIET BETAALD — verlopen (klant heeft niet afgerond)"
};

// Namen van de betaalmethodes zoals Mollie ze doorgeeft
const METHODE = {
  bancontact: "Bancontact", creditcard: "Kaart", kbc: "KBC/CBC", belfius: "Belfius",
  ideal: "iDEAL", applepay: "Apple Pay", paypal: "PayPal", banktransfer: "Overschrijving"
};

const { markeerGebruikt } = require("./_gedeeld/korting");
const { sluitAan } = require("./_gedeeld/opslag");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Mollie-sleutel ontbreekt" };

  // Mollie stuurt "id=tr_xxxxx" als formulier-tekst
  let tekst = event.body || "";
  if (event.isBase64Encoded) tekst = Buffer.from(tekst, "base64").toString("utf8");
  const betaalId = new URLSearchParams(tekst).get("id") || "";
  if (!/^tr_[A-Za-z0-9]+$/.test(betaalId)) {
    return { statusCode: 400, body: "Ongeldig betaal-id" };
  }

  // 1) De echte status bij Mollie opvragen
  let betaling;
  try {
    const resp = await fetch(`https://api.mollie.com/v2/payments/${betaalId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    if (resp.status === 404) return { statusCode: 200, body: "Onbekende betaling — genegeerd" };
    if (!resp.ok) return { statusCode: 502, body: "Mollie gaf een fout" };   // Mollie probeert later opnieuw
    betaling = await resp.json();
  } catch (e) {
    return { statusCode: 502, body: "Kon Mollie niet bereiken" };           // Mollie probeert later opnieuw
  }

  const omschrijving = AFGEROND[betaling.status];
  if (!omschrijving) {
    return { statusCode: 200, body: `Status ${betaling.status} — nog niets te melden` };
  }

  const md = betaling.metadata || {};

  // Betaald met een persoonlijke welkomstcode? Dan is die code nu opgebruikt.
  // Lukt dat niet, dan laten we de melding hieronder gewoon doorgaan.
  if (betaling.status === "paid" && md.kortingscode) {
    try {
      sluitAan(event);
      await markeerGebruikt(md.kortingscode, md.bestelnummer, "online");
    } catch (e) {
      console.log("Kortingscode niet als gebruikt gemarkeerd:", e.message);
    }
  }

  // 2) Melding als Netlify-formulier "betaling" insturen -> jij krijgt een mail
  const bedrag = betaling.amount ? `€${String(betaling.amount.value).replace(".", ",")}` : "";
  const velden = {
    "form-name":     "betaling",
    bestelnummer:    md.bestelnummer || "(onbekend)",
    status:          omschrijving,
    bedrag:          bedrag,
    betaalmethode:   METHODE[betaling.method] || betaling.method || "",
    email:           md.email || "",
    korting:         md.kortingscode ? `${md.kortingscode} (${md.korting})` : "geen",
    mollie_id:       betaling.id,
    tijdstip:        new Date().toLocaleString("nl-BE", { timeZone: "Europe/Brussels" })
  };

  const siteUrl = process.env.URL || `https://${(event.headers || {}).host}`;
  try {
    const r = await fetch(`${siteUrl}/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(velden).toString()
    });
    if (!r.ok) return { statusCode: 502, body: `Formulier niet aanvaard (${r.status})` };  // opnieuw proberen
  } catch (e) {
    return { statusCode: 502, body: "Formulier versturen mislukt" };                     // opnieuw proberen
  }

  // 200 = "ontvangen" voor Mollie. Bij een andere code probeert Mollie het later opnieuw.
  return { statusCode: 200, body: "OK" };
};
