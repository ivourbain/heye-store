// ============================================================
//  _gedeeld/lambda.js  —  gedeelde code, GEEN eigen functie
//  "Vertaler" tussen het NIEUWE functieformaat van Netlify en de
//  manier waarop onze functies geschreven zijn.
//
//  Netlify schaft het oude formaat (exports.handler met event, en
//  { statusCode, body } terug) af: deploys falen vanaf juni 2027.
//  Het nieuwe formaat geeft een Request en verwacht een Response.
//  Deze vertaler zet het Request om naar het vertrouwde "event",
//  roept onze functie aan, en zet het antwoord om naar een Response.
//  Zo bleef de binnenkant van elke functie gewoon hetzelfde.
//  (Netlify biedt zelf exact dezelfde aanpak aan als overstap.)
// ============================================================

export async function alsLambda(req, handler) {
  const url = new URL(req.url);
  const body = (req.method === "GET" || req.method === "HEAD") ? "" : await req.text();
  const event = {
    httpMethod: req.method,
    body: body,
    isBase64Encoded: false,
    headers: Object.fromEntries(req.headers),          // namen in kleine letters, bv. "host"
    queryStringParameters: Object.fromEntries(url.searchParams)
  };
  const r = (await handler(event)) || {};
  return new Response(r.body == null ? "" : r.body, {
    status: r.statusCode || 200,
    headers: r.headers || { "Content-Type": "application/json" }
  });
}
