// ============================================================
//  _gedeeld/korting.js  —  gedeelde code, GEEN eigen functie
//  (Netlify maakt van deze map geen functie omdat er geen
//   index.js of _gedeeld.js in staat. check-korting.js en
//   create-payment.js halen dit bestand binnen met require.)
//
//  Hier staat op één plaats:
//   - welke kortingscodes geldig zijn
//   - hoe de korting berekend wordt
//
//  WAAR STAAN DE CODES?
//  Niet in de website (dan kan iedereen ze lezen), maar in Netlify:
//     Project configuration -> Environment variables -> KORTINGSCODES
//  Meerdere codes scheiden met een komma. Bijvoorbeeld:
//     ACTIECODE,FLYERCODE=20
//  "ACTIECODE"  = percentage uit instellingen.js (korting.percentage)
//  "FLYERCODE=20" = deze code geeft 20%, los van instellingen.js
//  Hoofd- of kleine letters maakt niet uit.
//
//  PERSOONLIJKE WELKOMSTCODES (bv. HEYE-K7QP3M)
//  Die maakt vraag-korting.mjs aan en bewaart ze in de opslag
//  (zie opslag.js). Ze werken één keer, en enkel tot hun vervaldatum.
//  Ze worden pas "gebruikt" als er echt besteld is:
//    - online: zodra Mollie "betaald" meldt (mollie-webhook.js)
//    - overschrijving: zodra de bestelling binnenkomt (submission-created.js)
// ============================================================

const crypto = require("crypto");
const { opslag } = require("./opslag");

// Standaardwaarden, voor het geval instellingen.js geen "korting" bevat
const STANDAARD = { actief: true, percentage: 15, minimum: 25, welkom: true, geldigDagen: 30 };

// Persoonlijke code: HEYE- + 6 tekens. Geen 0/O en 1/I, die lijken te veel op elkaar.
const TEKENS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PERSOONLIJK = /^HEYE-[A-Z0-9]{6}$/;

function kortingInstellingen(instellingen) {
  const k = (instellingen && instellingen.korting) || {};
  return {
    actief:     k.actief !== false,
    percentage: Number(k.percentage) > 0 ? Number(k.percentage) : STANDAARD.percentage,
    minimum:    Number(k.minimum) >= 0 && k.minimum !== "" && k.minimum != null ? Number(k.minimum) : STANDAARD.minimum,
    welkom:     k.welkom !== false,
    geldigDagen: Number(k.geldigDagen) > 0 ? Number(k.geldigDagen) : STANDAARD.geldigDagen
  };
}

// " actiecode " -> "ACTIECODE". Enkel letters, cijfers en een streepje.
function netteCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
}

// Een nieuwe willekeurige persoonlijke code
function maakCode() {
  const bytes = crypto.randomBytes(6);
  let code = "HEYE-";
  for (const b of bytes) code += TEKENS[b % TEKENS.length];
  return code;
}

// 2026-11-18T... -> "18/11/2026"
function datumTekst(iso) {
  return new Date(iso).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels", day: "2-digit", month: "2-digit", year: "numeric" });
}

// Zoekt een code op. Geeft { geldig, code, percentage, minimum, reden } terug.
// (async: persoonlijke codes moeten in de opslag opgezocht worden)
async function zoekCode(invoer, instellingen) {
  const inst = kortingInstellingen(instellingen);
  const code = netteCode(invoer);

  if (!code)        return { geldig: false, reden: "Vul een kortingscode in." };
  if (!inst.actief) return { geldig: false, reden: "Er lopen momenteel geen kortingsacties." };

  const lijst = String(process.env.KORTINGSCODES || "").split(",");
  for (const regel of lijst) {
    const [naam, pct] = regel.split("=");
    if (netteCode(naam) && netteCode(naam) === code) {
      const percentage = Number(pct) > 0 && Number(pct) < 100 ? Number(pct) : inst.percentage;
      return { geldig: true, code, percentage, minimum: inst.minimum };
    }
  }

  // Persoonlijke welkomstcode?
  if (PERSOONLIJK.test(code)) {
    const info = await opslag().get(`code/${code}`, { type: "json" });
    if (info) {
      if (info.gebruikt) {
        return { geldig: false, reden: "Deze kortingscode werd al gebruikt. Een welkomstcode werkt maar één keer." };
      }
      if (Date.now() > new Date(info.geldigTot).getTime()) {
        return { geldig: false, reden: `Deze kortingscode is verlopen (ze was geldig tot ${datumTekst(info.geldigTot)}).` };
      }
      const percentage = Number(info.percentage) > 0 ? Number(info.percentage) : inst.percentage;
      return { geldig: true, code, percentage, minimum: inst.minimum, persoonlijk: true, geldigTot: info.geldigTot };
    }
  }

  return { geldig: false, reden: "Deze kortingscode kennen we niet (of ze is niet meer geldig)." };
}

// Afronden op hele centen
function centen(bedrag) {
  return Math.round(bedrag * 100) / 100;
}

// Korting in euro voor een subtotaal (producten, incl. btw).
// Onder het minimumbedrag: 0.
function kortingBedrag(subtotaal, info) {
  if (!info || !info.geldig) return 0;
  if (subtotaal < info.minimum) return 0;
  return centen(subtotaal * info.percentage / 100);
}

// Een persoonlijke code op "gebruikt" zetten. Andere codes (uit KORTINGSCODES)
// mogen meermaals gebruikt worden: daar doen we niets mee.
// Geeft true terug als de code nu (of al eerder) op gebruikt staat.
async function markeerGebruikt(invoer, bestelnummer, hoe) {
  const code = netteCode(invoer);
  if (!PERSOONLIJK.test(code)) return false;
  const kast = opslag();
  const huidig = await kast.getWithMetadata(`code/${code}`, { type: "json" });
  if (!huidig || !huidig.data) return false;
  if (huidig.data.gebruikt) return true;
  const nieuw = Object.assign({}, huidig.data, {
    gebruikt: true,
    gebruiktOp: new Date().toISOString(),
    bestelnummer: String(bestelnummer || "").slice(0, 40),
    betaalwijze: hoe || ""
  });
  // onlyIfMatch: enkel opslaan als niemand anders hem intussen wijzigde
  await kast.setJSON(`code/${code}`, nieuw, { onlyIfMatch: huidig.etag });
  return true;
}

module.exports = {
  zoekCode, kortingBedrag, kortingInstellingen, netteCode, centen,
  maakCode, markeerGebruikt, datumTekst, PERSOONLIJK
};
