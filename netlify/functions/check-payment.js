// ============================================================
//  check-payment.js  —  Netlify Function
//  Vraagt aan Mollie wat de status van een betaling is.
//  De Bedankt-pagina roept dit aan om te weten of er ÉCHT betaald is,
//  vóór ze het winkelmandje leegmaakt.
//
//  Draait op de SERVER van Netlify (net als create-payment.js),
//  zodat je geheime Mollie-sleutel nooit in de browser terechtkomt.
// ============================================================

exports.handler = async (event) => {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Mollie-sleutel ontbreekt op de server" }) };
  }

  // Het betaal-id komt mee als ?id=tr_xxxxx
  const betaalId = String((event.queryStringParameters || {}).id || "");

  // Kleine veiligheidscheck: een Mollie-betaal-id begint met "tr_" en bevat
  // enkel letters en cijfers. Zo sturen we geen rare invoer door.
  if (!/^tr_[A-Za-z0-9]+$/.test(betaalId)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Ongeldig betaal-id" }) };
  }

  try {
    const resp = await fetch(`https://api.mollie.com/v2/payments/${betaalId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    const resultaat = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: resultaat.detail || "Mollie gaf een fout terug" })
      };
    }

    // We geven enkel de status door (bv. "paid", "open", "canceled", "expired", "failed").
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: resultaat.status,
        betaald: resultaat.status === "paid"
      })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Kon Mollie niet bereiken" }) };
  }
};
