// ============================================================
//  opruimen.js  —  Netlify Function die ELKE NACHT vanzelf draait
//  (zie "config" onderaan). Niemand hoeft hier iets voor te doen.
//
//  Houdt de beloftes uit privacy.html:
//   - onbevestigde nieuwsbriefinschrijvingen (met het e-mailadres)
//     verdwijnen zodra de bevestigingslink verlopen is (7 dagen)
//   - welkomstcodes verdwijnen één jaar nadat ze verlopen of gebruikt zijn
//   - de dagtellers (rem op misbruik) verdwijnen na een week
//  Het bewijs van een BEVESTIGDE nieuwsbriefinschrijving blijft staan.
// ============================================================

import { opslag } from "./_gedeeld/opslag.js";

const DAG = 24 * 3600 * 1000;

async function sleutels(kast, prefix) {
  const r = await kast.list({ prefix });
  return (r && r.blobs ? r.blobs : []).map(b => b.key);
}

export async function ruimOp(nu = Date.now()) {
  const kast = opslag();
  const teller = { inschrijvingen: 0, codes: 0, dagtellers: 0 };

  // 1) Verlopen, onbevestigde inschrijvingen
  for (const sleutel of await sleutels(kast, "inschrijving/")) {
    const v = await kast.get(sleutel, { type: "json" });
    if (v && nu <= new Date(v.geldigTot).getTime()) continue;
    await kast.delete(sleutel);
    teller.inschrijvingen++;
    if (v && v.emailHash) {
      const nb = await kast.get(`nieuwsbrief/${v.emailHash}`, { type: "json" });
      if (nb && nb.status === "wacht" && nb.token === sleutel.split("/")[1]) {
        await kast.delete(`nieuwsbrief/${v.emailHash}`);
      }
    }
  }

  // 2) Welkomstcodes: één jaar na verval of gebruik
  for (const sleutel of await sleutels(kast, "code/")) {
    const v = await kast.get(sleutel, { type: "json" });
    if (!v) continue;
    const einde = new Date(v.gebruikt && v.gebruiktOp ? v.gebruiktOp : v.geldigTot).getTime();
    if (nu <= einde + 365 * DAG) continue;
    await kast.delete(sleutel);
    teller.codes++;
    if (v.emailHash) {
      const e = await kast.get(`email/${v.emailHash}`, { type: "json" });
      if (e && `code/${e.code}` === sleutel) await kast.delete(`email/${v.emailHash}`);
    }
  }

  // 3) Dagtellers van meer dan een week geleden
  const grens = new Date(nu - 7 * DAG).toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
  for (const sleutel of await sleutels(kast, "teller/")) {
    if (sleutel.slice("teller/".length) < grens) { await kast.delete(sleutel); teller.dagtellers++; }
  }
  return teller;
}

export default async () => {
  try {
    const t = await ruimOp();
    console.log("Opgeruimd:", JSON.stringify(t));
  } catch (e) {
    console.log("Opruimen mislukt:", e.message);
  }
  return new Response("OK");
};

// Elke nacht (Netlify gebruikt hiervoor UTC-tijd)
export const config = { schedule: "@daily" };
