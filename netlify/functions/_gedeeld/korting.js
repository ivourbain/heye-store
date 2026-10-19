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
//  (Stap 2 voegt hier straks de unieke welkomstcodes aan toe.)
// ============================================================

// Standaardwaarden, voor het geval instellingen.js geen "korting" bevat
const STANDAARD = { actief: true, percentage: 15, minimum: 25 };

function kortingInstellingen(instellingen) {
  const k = (instellingen && instellingen.korting) || {};
  return {
    actief:     k.actief !== false,
    percentage: Number(k.percentage) > 0 ? Number(k.percentage) : STANDAARD.percentage,
    minimum:    Number(k.minimum) >= 0 && k.minimum !== "" && k.minimum != null ? Number(k.minimum) : STANDAARD.minimum
  };
}

// " actiecode " -> "ACTIECODE". Enkel letters, cijfers en een streepje.
function netteCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
}

// Zoekt een code op. Geeft { geldig, code, percentage, minimum, reden } terug.
function zoekCode(invoer, instellingen) {
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

module.exports = { zoekCode, kortingBedrag, kortingInstellingen, netteCode, centen };
