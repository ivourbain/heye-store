// ============================================================
//  create-payment.js  —  Netlify Function
//  Maakt een betaling aan bij Mollie en geeft de betaal-link terug.
//  Deze code draait op de SERVER van Netlify, niet in de browser,
//  zodat je geheime Mollie-sleutel nooit zichtbaar is voor bezoekers.
//
//  De sleutel zet je in Netlify onder:
//     Project configuration → Environment variables → MOLLIE_API_KEY
//  (begin met je TEST-sleutel: test_xxxxx , later je live-sleutel)
// ============================================================

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

  const bedrag = Number(data.bedrag);
  const bestelnummer = String(data.bestelnummer || "").slice(0, 40);
  const email = String(data.email || "").slice(0, 100);

  if (!(bedrag > 0) || !bestelnummer) {
    return { statusCode: 400, body: JSON.stringify({ error: "Bedrag of bestelnummer ontbreekt" }) };
  }

  // Adres van je eigen site (Netlify vult process.env.URL automatisch in)
  const siteUrl = process.env.URL || `https://${event.headers.host}`;

  // De betaling die we bij Mollie aanmaken
  const betaling = {
    amount: { currency: "EUR", value: bedrag.toFixed(2) },   // bv. "12.90"
    description: `Melissa bestelling ${bestelnummer}`,
    redirectUrl: `${siteUrl}/betaald.html?bestelnummer=${encodeURIComponent(bestelnummer)}`,
    metadata: { bestelnummer: bestelnummer, email: email }
    // 'method' laten we open → Mollie toont de klant zijn betaalmethodes
    // (Bancontact, kaart, …). Zet je dit op "bancontact", dan gaat het meteen daarheen.
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
        betaalId: resultaat.id
      })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Kon Mollie niet bereiken" }) };
  }
};
