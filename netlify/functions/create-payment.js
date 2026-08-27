exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Mollie-sleutel ontbreekt op de server" }) };
  }

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

  const siteUrl = process.env.URL || `https://${event.headers.host}`;

  const betaling = {
    amount: { currency: "EUR", value: bedrag.toFixed(2) },
    description: `Melissa bestelling ${bestelnummer}`,
    redirectUrl: `${siteUrl}/betaald.html?bestelnummer=${encodeURIComponent(bestelnummer)}`,
    metadata: { bestelnummer: bestelnummer, email: email }
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
      return { statusCode: 502, body: JSON.stringify({ error: resultaat.detail || "Mollie gaf een fout terug" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ checkoutUrl: resultaat._links.checkout.href }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Kon Mollie niet bereiken" }) };
  }
};
