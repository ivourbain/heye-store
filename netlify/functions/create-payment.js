// ============================================================
//  create-payment.js  —  Netlify Function
//  Maakt een betaling aan bij Mollie en geeft de betaal-link terug.
//  Deze code draait op de SERVER van Netlify, niet in de browser,
//  zodat je geheime Mollie-sleutel nooit zichtbaar is voor bezoekers.
//
//  De sleutel zet je in Netlify onder:
//     Project configuration -> Environment variables -> MOLLIE_API_KEY
//  (begin met je TEST-sleutel: test_xxxxx , later je live-sleutel)
//
//  BELANGRIJK (aangepast): de browser zegt niet meer WAT het kost.
//  De browser stuurt enkel WAT er besteld is (product-id's + aantallen).
//  Deze server leest zelf products.js, rekent de prijs uit en stuurt
//  DAT bedrag naar Mollie. Zo kan niemand met de ontwikkelaarsconsole
//  een bestelling van 30 euro voor 1 cent afrekenen.
// ============================================================

const fs = require("fs");
const path = require("path");

// ⚙️ VERZENDKOSTEN — deze twee getallen moeten GELIJK zijn aan die in
//    index.html (const VERZENDING). Pas je er één aan, pas dan ook de
//    andere aan. Ziet de server een ander bedrag dan de browser toonde,
//    dan weigert hij de betaling (zie de controle verderop) — zo merk je
//    een vergeten aanpassing meteen, in plaats van pas bij je boekhouding.
const VERZENDING = { kosten: 4.95, gratisVanaf: 40 };

// Veiligheidsgrenzen: een echte bestelling blijft hier ruim onder.
const MAX_SOORTEN     = 100;   // hoeveel verschillende producten in één mandje
const MAX_PER_PRODUCT = 50;    // hoeveel stuks van hetzelfde product

// ---- products.js inlezen -------------------------------------------
// products.js is geschreven voor de browser ("const PRODUCTEN = [...]").
// Op de server knippen we gewoon het stuk tussen de eerste [ en de laatste ]
// eruit: dat is nette JSON. Zo blijft products.js het ENIGE bestand met
// prijzen in — geen tweede lijst die kan gaan afwijken.
let productCache = null;

function leesProducten() {
  if (productCache) return productCache;

  // Netlify zet meegeleverde bestanden niet altijd op dezelfde plek,
  // dus we proberen de gebruikelijke paden tot er één lukt.
  const kandidaten = [
    path.join(process.cwd(), "products.js"),
    path.join(__dirname, "products.js"),
    path.join(__dirname, "..", "..", "products.js"),
    "/var/task/products.js"
  ];

  for (const bestand of kandidaten) {
    try {
      const tekst = fs.readFileSync(bestand, "utf8");
      const start = tekst.indexOf("[");
      const eind  = tekst.lastIndexOf("]");
      if (start < 0 || eind < start) continue;

      const lijst = JSON.parse(tekst.slice(start, eind + 1));
      const kaart = {};
      lijst.forEach(p => { if (p && p.id) kaart[p.id] = p; });

      if (Object.keys(kaart).length === 0) continue;
      productCache = kaart;
      return kaart;
    } catch (e) {
      // dit pad werkte niet, probeer het volgende
    }
  }
  throw new Error("products.js niet gevonden of onleesbaar op de server");
}

// Afronden op hele centen. Zonder dit krijg je 2,9 x 3 = 8.700000000000001.
function centen(bedrag) {
  return Math.round(bedrag * 100) / 100;
}

exports.handler = async (event) => {
  // Enkel POST-verzoeken toelaten
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Mollie-sleutel ontbreekt op de server" }) };
  }

  // Gegevens uit de bestelling lezen
  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Ongeldige gegevens" }) };
  }

  const bestelnummer = String(data.bestelnummer || "").slice(0, 40);
  const email        = String(data.email || "").slice(0, 100);
  const mandjeIn     = (data.mandje && typeof data.mandje === "object") ? data.mandje : null;

  if (!bestelnummer) {
    return { statusCode: 400, body: JSON.stringify({ error: "Bestelnummer ontbreekt" }) };
  }
  if (!mandjeIn) {
    return { statusCode: 400, body: JSON.stringify({ error: "Winkelmandje ontbreekt" }) };
  }

  // ---- De prijs hier uitrekenen, niet in de browser ----
  let producten;
  try {
    producten = leesProducten();
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Productlijst niet leesbaar op de server" }) };
  }

  const ids = Object.keys(mandjeIn);
  if (ids.length === 0 || ids.length > MAX_SOORTEN) {
    return { statusCode: 400, body: JSON.stringify({ error: "Winkelmandje is leeg of te groot" }) };
  }

  let subtotaal = 0;
  let aantalStuks = 0;

  for (const id of ids) {
    const aantal = Math.floor(Number(mandjeIn[id]));
    if (!Number.isFinite(aantal) || aantal < 1 || aantal > MAX_PER_PRODUCT) {
      return { statusCode: 400, body: JSON.stringify({ error: `Ongeldig aantal bij ${id}` }) };
    }

    const p = producten[id];
    if (!p) {
      return { statusCode: 400, body: JSON.stringify({ error: `Onbekend product: ${id}` }) };
    }
    // Een verborgen product hoort niet verkocht te worden, ook niet via
    // een oud mandje dat nog in een browser stond.
    if (p.zichtbaar === false) {
      return { statusCode: 400, body: JSON.stringify({ error: `Product niet meer beschikbaar: ${id}` }) };
    }

    const stukprijs = Number(p.prijs_incl_btw);
    if (!(stukprijs > 0)) {
      return { statusCode: 400, body: JSON.stringify({ error: `Geen geldige prijs bij ${id}` }) };
    }

    subtotaal += stukprijs * aantal;
    aantalStuks += aantal;
  }

  subtotaal = centen(subtotaal);
  const verzending = (subtotaal <= 0 || subtotaal >= VERZENDING.gratisVanaf) ? 0 : VERZENDING.kosten;
  const bedrag = centen(subtotaal + verzending);

  if (!(bedrag > 0)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Berekend bedrag is nul" }) };
  }

  // ---- Controle tegen wat de klant op zijn scherm zag ----
  // De browser stuurt zijn eigen totaal mee, puur ter controle. Wijkt het af,
  // dan klopt er iets niet (bv. verzendkosten hier anders dan in index.html,
  // of een prijs die net gewijzigd is terwijl de klant aan het bestellen was).
  // We rekenen dan liever NIETS af dan het verkeerde bedrag.
  const controle = Number(data.controlebedrag);
  if (Number.isFinite(controle) && Math.abs(controle - bedrag) > 0.011) {
    return {
      statusCode: 409,
      body: JSON.stringify({
        error: `Bedrag klopt niet: scherm ${controle.toFixed(2)} tegenover server ${bedrag.toFixed(2)}`
      })
    };
  }

  // Adres van je eigen site (Netlify vult process.env.URL automatisch in)
  const siteUrl = process.env.URL || `https://${event.headers.host}`;

  // De betaling die we bij Mollie aanmaken
  const betaling = {
    amount: { currency: "EUR", value: bedrag.toFixed(2) },   // bv. "12.90"
    description: `Heye Store bestelling ${bestelnummer}`,
    redirectUrl: `${siteUrl}/betaald.html?bestelnummer=${encodeURIComponent(bestelnummer)}`,
    metadata: {
      bestelnummer: bestelnummer,
      email: email,
      stuks: aantalStuks,
      subtotaal: subtotaal.toFixed(2),
      verzending: verzending.toFixed(2)
    }
    // 'method' laten we open -> Mollie toont de klant zijn betaalmethodes
    // (Bancontact, kaart, ...). Zet je dit op "bancontact", dan gaat het meteen daarheen.
  };

  try {
    const resp = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(betaling)
    });

    const resultaat = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: resultaat.detail || "Mollie gaf een fout terug" })
      };
    }

    // De link waar de klant naartoe moet om te betalen, plus het betaal-id.
    // Dat id gebruiken we straks om bij Mollie te controleren of er écht betaald is.
    return {
      statusCode: 200,
      body: JSON.stringify({
        checkoutUrl: resultaat._links.checkout.href,
        betaalId: resultaat.id,
        bedrag: bedrag            // wat er werkelijk afgerekend wordt
      })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Kon Mollie niet bereiken" }) };
  }
};
