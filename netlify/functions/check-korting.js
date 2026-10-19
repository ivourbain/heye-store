// ============================================================
//  check-korting.js  —  Netlify Function
//  Het mandje vraagt hier of een kortingscode geldig is.
//
//  De lijst met codes staat geheim op de server (KORTINGSCODES in
//  Netlify), nooit in de website. Dit antwoord is enkel om de klant
//  meteen te tonen wat de korting wordt. Het ECHTE bedrag rekent
//  create-payment.js bij het betalen nog eens zelf uit.
//
//  Vraag:    POST { "code": "VOORBEELD" }
//  Antwoord: { geldig: true,  code, percentage, minimum }
//         of { geldig: false, reden }
// ============================================================

import { zoekCode } from "./_gedeeld/korting.js";
import { leesInstellingen } from "./_gedeeld/instellingen.js";
import { alsLambda } from "./_gedeeld/lambda.js";

async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ geldig: false, reden: "Ongeldige gegevens" }) };
  }

  let instellingen = {};
  try { instellingen = leesInstellingen(); } catch (e) { /* standaardwaarden gebruiken */ }

  let info;
  try {
    info = await zoekCode(data.code, instellingen);
  } catch (e) {
    return { statusCode: 503, body: JSON.stringify({ geldig: false, reden: "Even geen controle mogelijk" }) };
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(info)
  };
}

// Nieuw Netlify-formaat: Request erin, Response eruit (zie _gedeeld/lambda.js)
export default (req) => alsLambda(req, handler);
