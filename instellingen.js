// ============================================================
//  instellingen.js  —  ALLE instellingen en teksten van de winkel
// ------------------------------------------------------------
//  Dit is het enige bestand waar winkelgegevens, verzendkosten,
//  afdelingen en welkomstteksten staan. De webshop (index.html),
//  de juridische pagina's, de bedankpagina én de betaalfunctie op
//  de server (create-payment.js) lezen allemaal van hier.
//  Pas je hier iets aan, dan verandert het overal tegelijk.
//
//  Straks past de backoffice dit bestand voor je aan. Bewerk je het
//  toch met de hand, let dan op:
//    - tussen de accolades staat strikt JSON: tekst tussen "dubbele"
//      aanhalingstekens, een komma tussen elk onderdeel, géén komma
//      na het laatste onderdeel, en géén commentaar.
//    - bedragen met een punt: 4.95 (niet 4,95)
//
//  Wat staat waar:
//    thema       kleur van de winkel: "oranje" (echte winkel) of "blauw" (testwinkel)
//    winkel      naam voor de klant, regel onder het logo, begin van het bestelnummer
//    bedrijf     juridische gegevens (voorwaarden, privacy, retour, voetbalk)
//    betaling    rekening voor de QR-overschrijving
//    verzending  verzendkosten, grens gratis verzending, levertermijn in werkdagen
//    infobalk    het zwarte balkje bovenaan elke pagina. Je mag deze
//                invulwoorden gebruiken, ze worden vanzelf ingevuld:
//                  gratisVanaf, verzendkost, levering  (tussen accolades)
//    welkom      de banner als de klant "Alles" bekijkt
//    afdelingVolgorde  volgorde van de afdelingsknoppen (en op de pakbon)
//    afdelingen  per afdeling: knopnaam, merk (wordt vooraan de productnaam
//                weggelaten), bannertitel en -tekst, en het woord boven het
//                keuzelijstje bij varianten
//    categorieVolgorde volgorde van de categorieknopjes. Een categorie die
//                hier niet in staat, komt gewoon achteraan.
// ============================================================

const INSTELLINGEN = {
  "thema": "oranje",
  "winkel": {
    "toonnaam": "Heye Store",
    "slogan": "haaraccessoires & brillen",
    "bestelcode": "HS"
  },
  "bedrijf": {
    "naam": "CR.Service - Heye Store",
    "straat": "Winkelstraat 69/1",
    "postcode": "2890",
    "gemeente": "Sint-Amands",
    "land": "België",
    "ondernemingsnummer": "0449.281.828",
    "btw": "BE 0449.281.828",
    "email": "ivo.urbain@gmail.com"
  },
  "betaling": {
    "rekeninghouder": "CR.Service - Heye Store",
    "iban": "BE84731068044259",
    "bic": ""
  },
  "verzending": {
    "kosten": 4.95,
    "gratisVanaf": 40,
    "leveringMin": 2,
    "leveringMax": 5
  },
  "infobalk": {
    "vet": "Gratis verzending vanaf {gratisVanaf}",
    "rest": [
      "Levering in {levering} werkdagen",
      "Veilig betalen met Bancontact"
    ]
  },
  "welkom": {
    "titel": "Welkom bij Heye Store",
    "tekst": "Zorgvuldig gekozen accessoires, eerlijk geprijsd en rechtstreeks bij jou thuis geleverd."
  },
  "afdelingVolgorde": [
    "melissa",
    "montana",
    "diverse"
  ],
  "afdelingen": {
    "melissa": {
      "naam": "Melissa Haarmode",
      "merk": "Melissa",
      "titel": "Mooie haar- & verzorgingsaccessoires",
      "tekst": "Ontdek de collectie van Melissa — haarclips, kammen, borstels, kwasten en meer. Zorgvuldig gekozen, eerlijk geprijsd en rechtstreeks bij jou thuis geleverd.",
      "variantLabel": "Uitvoering"
    },
    "montana": {
      "naam": "Montana Brillen",
      "merk": "Montana",
      "titel": "Brillen van Montana",
      "tekst": "Leesbrillen, computerbrillen met blauwlichtfilter en neckreaders. Duidelijke sterktes, eerlijke prijzen, rechtstreeks bij jou thuis geleverd.",
      "variantLabel": "Sterkte"
    },
    "diverse": {
      "naam": "Diverse",
      "merk": "",
      "titel": "Nog meer moois",
      "tekst": "Een selectie die niet in de andere afdelingen past, maar wel de moeite waard is.",
      "variantLabel": "Uitvoering"
    }
  },
  "categorieVolgorde": [
    "Haarclips",
    "Haarborstels",
    "Haarkammen",
    "Haarelastieken",
    "Haarbanden",
    "Make-up",
    "Pincetten",
    "Nagelverzorging",
    "Sponzen",
    "Accessoires"
  ]
};
