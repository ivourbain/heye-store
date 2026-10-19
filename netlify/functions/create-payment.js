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

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const HIER = path.dirname(fileURLToPath(import.meta.url));
// Kortingscodes: welke geldig zijn en hoe de korting berekend wordt
import { zoekCode, kortingBedrag } from "./_gedeeld/korting.js";
import { alsLambda } from "./_gedeeld/lambda.js";

// ⚙️ VERZENDKOSTEN staan niet meer hier, maar in instellingen.js — hetzelfde
//    bestand dat de webshop gebruikt. Zo kunnen browser en server nooit meer
//    van elkaar afwijken. (De controle op het schermbedrag verderop blijft
//    staan als extra vangnet.)

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
    path.join(HIER, "products.js"),
    path.join(HIER, "..", "..", "products.js"),
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

// ---- instellingen.js inlezen ---------------------------------------
// Ook dit bestand is voor de browser geschreven ("const INSTELLINGEN = {...};").
// Na "const INSTELLINGEN =" tot de laatste } staat nette JSON.
let instellingenCache = null;

function leesInstellingen() {
  if (instellingenCache) return instellingenCache;

  const kandidaten = [
    path.join(process.cwd(), "instellingen.js"),
    path.join(HIER, "instellingen.js"),
    path.join(HIER, "..", "..", "instellingen.js"),
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

      const inst = JSON.parse(tekst.slice(start, eind + 1));
      const v = inst.verzending || {};
      // Liever geen betaling dan een betaling met onzinnige verzendkosten.
      if (!(Number(v.kosten) >= 0) || !(Number(v.gratisVanaf) > 0)) continue;

      instellingenCache = inst;
      return inst;
    } catch (e) {
      // dit pad werkte niet, probeer het volgende
    }
  }
  throw new Error("instellingen.js niet gevonden of onleesbaar op de server");
}

// Afronden op hele centen. Zonder dit krijg je 2,9 x 3 = 8.700000000000001.
function centen(bedrag) {
  return Math.round(bedrag * 100) / 100;
}

async function handler(event) {
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

  let instellingen;
  try {
    instellingen = leesInstellingen();
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Instellingen niet leesbaar op de server" }) };
  }
  const VERZENDING = {
    kosten:      Number(instellingen.verzending.kosten),
    gratisVanaf: Number(instellingen.verzending.gratisVanaf)
  };
  const winkelnaam = (instellingen.winkel && instellingen.winkel.toonnaam) || "Heye Store";

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

  // ---- Kortingscode (optioneel) ----
  // De browser stuurt enkel de CODE mee, nooit het kortingsbedrag. We kijken
  // hier zelf of de code bestaat en rekenen de korting zelf uit.
  let korting = 0;
  let kortingInfo = null;
  if (data.kortingscode) {
    try {
      kortingInfo = await zoekCode(data.kortingscode, instellingen);
    } catch (e) {
      return { statusCode: 503, body: JSON.stringify({ error: "Kortingscode kon nu niet gecontroleerd worden" }) };
    }
    if (!kortingInfo.geldig) {
      return { statusCode: 400, body: JSON.stringify({ error: `Kortingscode: ${kortingInfo.reden}` }) };
    }
    korting = kortingBedrag(subtotaal, kortingInfo);
    if (korting <= 0) {
      return { statusCode: 400, body: JSON.stringify({
        error: `Kortingscode geldt pas vanaf €${kortingInfo.minimum.toFixed(2).replace(".", ",")}` }) };
    }
  }

  // Verzending hangt af van wat de klant NA korting voor producten betaalt
  const naKorting  = centen(subtotaal - korting);
  const verzending = (naKorting <= 0 || naKorting >= VERZENDING.gratisVanaf) ? 0 : VERZENDING.kosten;
  const bedrag = centen(naKorting + verzending);

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
    description: `${winkelnaam} bestelling ${bestelnummer}`,
    redirectUrl: `${siteUrl}/betaald.html?bestelnummer=${encodeURIComponent(bestelnummer)}`,
    // Mollie meldt elke statuswijziging aan dit adres (zie mollie-webhook.js).
    // Enkel op een echt https-adres: Mollie kan een lokale testserver niet bereiken.
    ...(siteUrl.startsWith("https://") ? { webhookUrl: `${siteUrl}/.netlify/functions/mollie-webhook` } : {}),
    metadata: {
      bestelnummer: bestelnummer,
      email: email,
      stuks: aantalStuks,
      subtotaal: subtotaal.toFixed(2),
      verzending: verzending.toFixed(2),
      // Leeg als er geen kortingscode gebruikt werd
      kortingscode: kortingInfo ? kortingInfo.code : "",
      korting: korting ? `${kortingInfo.percentage}% = ${korting.toFixed(2)}` : ""
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
}

// Nieuw Netlify-formaat: Request erin, Response eruit (zie _gedeeld/lambda.js)
export default (req) => alsLambda(req, handler);
