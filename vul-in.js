// ============================================================
//  vul-in.js  —  zet de gegevens uit instellingen.js op de pagina
// ------------------------------------------------------------
//  Elke pagina laadt eerst instellingen.js en dan dit bestand.
//  Het doet drie dingen:
//
//  0) De kleuren van de winkel zetten, volgens "thema" in instellingen.js
//     ("blauw" = de echte winkel, "paars" = de testwinkel, "oranje" = de oude kleur). Dat gebeurt
//     meteen, nog vóór de pagina getekend wordt.
//
//  1) Het zwarte infobalkje bovenaan opbouwen
//     (elk element met class="infobalk").
//
//  2) Elk stukje tekst met een data-i="..." invullen. Voorbeeld:
//        <span data-i="email">ivo.urbain@gmail.com</span>
//     De tekst die er in de HTML al staat, is een reserve: ze blijft
//     zichtbaar als dit script om een of andere reden niet laadt.
//
//  Beschikbare namen voor data-i (en voor de invulwoorden in de infobalk):
//     toonnaam, bedrijfsnaam, straat, postcode, gemeente, land,
//     adres          "Winkelstraat 69/1, 2890 Sint-Amands"
//     adresLand      "Winkelstraat 69/1, 2890 Sint-Amands, België"
//     ondernemingsnummer, btw, email,
//     verzendkost    "€4,95"
//     gratisVanaf    "€40"
//     levering       "2–5"        (zoals in de infobalk)
//     leveringTot    "2 tot 5"    (zoals in de voorwaarden)
// ============================================================

(function () {
  "use strict";

  if (typeof INSTELLINGEN === "undefined") {
    console.error("vul-in.js: instellingen.js is niet geladen");
    return;
  }
  const I = INSTELLINGEN;

  // ---- 0) Kleurenschema's ------------------------------------------------
  // Elke pagina heeft dezelfde kleurnamen (--oranje, --oranje-donker, ...).
  // Hier staat per thema welke kleur er in die namen komt. "oranje" bevat
  // exact de waarden die al in de pagina's staan.
  const THEMAS = {
    oranje: {
      "--oranje": "#c95000", "--oranje-donker": "#a84200", "--oranje-licht": "#fff4ed",
      "--accent-zacht": "#ffb27a", "--rand-accent": "#ffd9c2",
      "--hero-1": "#fff1e6", "--hero-2": "#ffe3cd", "--hero-3": "#ffd4b3", "--hero-tekst": "#6b4b54",
      browserbalk: "#ff6600"
    },
    blauw: {
      "--oranje": "#1565c0", "--oranje-donker": "#0d47a1", "--oranje-licht": "#eef4fc",
      "--accent-zacht": "#90caf9", "--rand-accent": "#bbdefb",
      "--hero-1": "#eef5fd", "--hero-2": "#dceafb", "--hero-3": "#c5dbf7", "--hero-tekst": "#33476a",
      browserbalk: "#1565c0"
    },
    paars: {
      "--oranje": "#7b1fa2", "--oranje-donker": "#5c1580", "--oranje-licht": "#f6eefa",
      "--accent-zacht": "#ce93d8", "--rand-accent": "#e1bee7",
      "--hero-1": "#f8f1fb", "--hero-2": "#efe0f6", "--hero-3": "#e6cff0", "--hero-tekst": "#4a3557",
      browserbalk: "#7b1fa2"
    }
  };
  const thema = THEMAS[I.thema] || THEMAS.oranje;
  Object.keys(thema).forEach(k => {
    if (k.startsWith("--")) document.documentElement.style.setProperty(k, thema[k]);
  });
  function zetBrowserbalk(){
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", thema.browserbalk);
  }

  // "€40" voor een rond bedrag, "€4,95" voor een bedrag met centen.
  function euroKort(bedrag) {
    const n = Number(bedrag);
    return "€" + (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));
  }

  const b = I.bedrijf || {}, v = I.verzending || {};
  const adres = `${b.straat}, ${b.postcode} ${b.gemeente}`;

  const WAARDEN = {
    toonnaam:           (I.winkel || {}).toonnaam,
    bedrijfsnaam:       b.naam,
    straat:             b.straat,
    postcode:           b.postcode,
    gemeente:           b.gemeente,
    land:               b.land,
    adres:              adres,
    adresLand:          b.land ? `${adres}, ${b.land}` : adres,
    ondernemingsnummer: b.ondernemingsnummer,
    btw:                b.btw,
    email:              b.email,
    verzendkost:        euroKort(v.kosten),
    gratisVanaf:        euroKort(v.gratisVanaf),
    levering:           `${v.leveringMin}–${v.leveringMax}`,
    leveringTot:        `${v.leveringMin} tot ${v.leveringMax}`
  };

  // "Gratis verzending vanaf {gratisVanaf}" -> "Gratis verzending vanaf €40"
  function vulWoordenIn(tekst) {
    return String(tekst || "").replace(/\{(\w+)\}/g, (heel, naam) =>
      (WAARDEN[naam] != null) ? WAARDEN[naam] : heel);
  }

  // Het infobalkje. We bouwen het met textContent, niet met innerHTML:
  // zo kan een teken als < of & in een tekst de pagina nooit breken.
  function maakInfobalk(balk) {
    const ib = I.infobalk;
    if (!ib) return;
    balk.textContent = "";
    const vet = document.createElement("strong");
    vet.textContent = vulWoordenIn(ib.vet);
    balk.appendChild(vet);

    const rest = document.createElement("span");
    rest.className = "weg-op-gsm";        // op een gsm verborgen
    (ib.rest || []).forEach(t => {
      const punt = document.createElement("span");
      punt.className = "scheiding";
      punt.textContent = "·";
      rest.appendChild(punt);
      rest.appendChild(document.createTextNode(vulWoordenIn(t)));
    });
    balk.appendChild(rest);
  }

  function vulAllesIn() {
    zetBrowserbalk();
    document.querySelectorAll(".infobalk").forEach(maakInfobalk);
    document.querySelectorAll("[data-i]").forEach(el => {
      const w = WAARDEN[el.dataset.i];
      if (w != null && w !== "") el.textContent = w;
      else console.warn("vul-in.js: onbekende of lege naam", el.dataset.i);
    });
  }

  // Ook beschikbaar voor index.html (dezelfde euro-notatie, zelfde invulwoorden).
  window.HEYE = { WAARDEN: WAARDEN, euroKort: euroKort, vulWoordenIn: vulWoordenIn };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", vulAllesIn);
  else vulAllesIn();
})();
