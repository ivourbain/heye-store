// De 82 Melissa-producten. Elk product heeft naam, prijs, foto en categorie.
const MELISSA_PRODUCTEN = [
  {
    "id": "ME26936",
    "ean": "8034139269368",
    "bestelcode": 128349,
    "naam": "Melissa Haarkam Haar 21Cm Zwart",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME26936.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME26937",
    "ean": "8034139269375",
    "bestelcode": 128350,
    "naam": "Melissa Haarkam Haar 18.6Cm Zwart",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME26937.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME26940",
    "ean": "8034139269405",
    "bestelcode": 128353,
    "naam": "Melissa Haarkam Haar 16Cm Zwart",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME26940.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME26941",
    "ean": "8034139269412",
    "bestelcode": 128354,
    "naam": "Melissa Haarkam Haar 14.5Cm Zwart",
    "prijs_incl_btw": 2.5,
    "retailprijs_excl_btw": 1.25,
    "foto": "fotos/ME26941.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME26944",
    "ean": "8034139269443",
    "bestelcode": 128357,
    "naam": "Melissa Haarkam Haar 20Cm Zwart",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME26944.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME26945",
    "ean": "8034139269450",
    "bestelcode": 128358,
    "naam": "Melissa Haarkam Haar 21.5Cm Zwart",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME26945.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME28585",
    "ean": "8034139285856",
    "bestelcode": 123770,
    "naam": "Melissa Haarclips Kroko 10 cm — 10 stuks, zwart",
    "prijs_incl_btw": 7.45,
    "retailprijs_excl_btw": 3.7,
    "foto": "fotos/ME28585.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME28626",
    "ean": "8034139286266",
    "bestelcode": 123255,
    "naam": "Melissa Haarborstel S/Touch 23Cm Rettang.Ass.",
    "prijs_incl_btw": 7.95,
    "retailprijs_excl_btw": 3.95,
    "foto": "fotos/ME28626.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME32803",
    "ean": "8034139328034",
    "bestelcode": 130004,
    "naam": "Melissa Haarclip 8.5Cm",
    "prijs_incl_btw": 4.55,
    "retailprijs_excl_btw": 2.25,
    "foto": "fotos/ME32803.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME32819",
    "ean": "8034139328195",
    "bestelcode": 130020,
    "naam": "Melissa Haarclip 7X3.5Cm",
    "prijs_incl_btw": 4.95,
    "retailprijs_excl_btw": 2.45,
    "foto": "fotos/ME32819.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME32822",
    "ean": "8034139328225",
    "bestelcode": 130023,
    "naam": "Melissa Haarclip 7X3.5Cm",
    "prijs_incl_btw": 6.6,
    "retailprijs_excl_btw": 3.28,
    "foto": "fotos/ME32822.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME35820",
    "ean": "8034139358208",
    "bestelcode": 133393,
    "naam": "Melissa Haarclip 4X2.5Cm 2 Stuks",
    "prijs_incl_btw": 6.6,
    "retailprijs_excl_btw": 3.28,
    "foto": "fotos/ME35820.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME35821",
    "ean": "8034139358215",
    "bestelcode": 133394,
    "naam": "Melissa Haarclip X2Cm 2 Stuks",
    "prijs_incl_btw": 5.95,
    "retailprijs_excl_btw": 2.95,
    "foto": "fotos/ME35821.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME37355",
    "ean": "8034139373553",
    "bestelcode": 134899,
    "naam": "Melissa Rvs Schaar Classic 9Cm Gebogen",
    "prijs_incl_btw": 5.95,
    "retailprijs_excl_btw": 2.95,
    "foto": "fotos/ME37355.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME42043",
    "ean": "8034139420431",
    "bestelcode": 141742,
    "naam": "Melissa Haarclips 8 cm — 4 stuks, zwart",
    "prijs_incl_btw": 3.55,
    "retailprijs_excl_btw": 1.75,
    "foto": "fotos/ME42043.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME44674",
    "ean": "8034139446745",
    "bestelcode": 144362,
    "naam": "Melissa Nageltang Nagels Inox 10Cm",
    "prijs_incl_btw": 11.2,
    "retailprijs_excl_btw": 5.56,
    "foto": "fotos/ME44674.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME801594",
    "ean": "8051597015948",
    "bestelcode": 228839,
    "naam": "Melissa Haarclip 5Cm 6Stuks",
    "prijs_incl_btw": 4.95,
    "retailprijs_excl_btw": 2.45,
    "foto": "fotos/ME801594.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME901754",
    "ean": "8055769017549",
    "bestelcode": 203895,
    "naam": "Melissa Blush-kwast schuin nr. 114",
    "prijs_incl_btw": 11.2,
    "retailprijs_excl_btw": 5.56,
    "foto": "fotos/ME901754.jpg",
    "categorie": "Make-up"
  },
  {
    "id": "ME903220",
    "ean": "8055769032207",
    "bestelcode": 201175,
    "naam": "Melissa Haarband Haar 2.5Cm",
    "prijs_incl_btw": 4.3,
    "retailprijs_excl_btw": 2.14,
    "foto": "fotos/ME903220.jpg",
    "categorie": "Haarbanden"
  },
  {
    "id": "ME905032",
    "ean": "8055769050324",
    "bestelcode": 205175,
    "naam": "Melissa Wenkbrauwpincet schuine bek — 9,5 cm",
    "prijs_incl_btw": 4.55,
    "retailprijs_excl_btw": 2.25,
    "foto": "fotos/ME905032.jpg",
    "categorie": "Pincetten"
  },
  {
    "id": "ME905041",
    "ean": "8055769050416",
    "bestelcode": 205554,
    "naam": "Melissa Nagelvijl Nagels 11.5Cm 10Stuks",
    "prijs_incl_btw": 2.5,
    "retailprijs_excl_btw": 1.25,
    "foto": "fotos/ME905041.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME905053",
    "ean": "8055769050539",
    "bestelcode": 205566,
    "naam": "Melissa Nageltang Nagels 9X6.2Cm",
    "prijs_incl_btw": 11.2,
    "retailprijs_excl_btw": 5.56,
    "foto": "fotos/ME905053.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME905604",
    "ean": "8055769056043",
    "bestelcode": 204127,
    "naam": "Melissa Haarborstel Magic 15X6Cm",
    "prijs_incl_btw": 11.2,
    "retailprijs_excl_btw": 5.56,
    "foto": "fotos/ME905604.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916465",
    "ean": "8055769164656",
    "bestelcode": 215902,
    "naam": "Melissa Borstel Nagels 8.3Cm",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.95,
    "foto": "fotos/ME916465.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916483",
    "ean": "8055769164830",
    "bestelcode": 216253,
    "naam": "Melissa Borstel Capel Professioneelsoft Touch Zwart 24X8",
    "prijs_incl_btw": 8.55,
    "retailprijs_excl_btw": 4.25,
    "foto": "fotos/ME916483.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916484",
    "ean": "8055769164847",
    "bestelcode": 216254,
    "naam": "Melissa Borstel Capel Professioneel Soft Touch Zwart 23X7",
    "prijs_incl_btw": 8.55,
    "retailprijs_excl_btw": 4.25,
    "foto": "fotos/ME916484.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916489",
    "ean": "8055769164892",
    "bestelcode": 216259,
    "naam": "Melissa Borstel Capel Professioneel Soft Touch Zwart 23X5",
    "prijs_incl_btw": 11.2,
    "retailprijs_excl_btw": 5.56,
    "foto": "fotos/ME916489.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916490",
    "ean": "8055769164908",
    "bestelcode": 216260,
    "naam": "Melissa Borstel Capel Professioneel Soft Touch Zwart 23X6",
    "prijs_incl_btw": 8.55,
    "retailprijs_excl_btw": 4.25,
    "foto": "fotos/ME916490.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916491",
    "ean": "8055769164915",
    "bestelcode": 216261,
    "naam": "Melissa Borstel Capel Professioneel Soft Touch Zwart 24X4",
    "prijs_incl_btw": 7.55,
    "retailprijs_excl_btw": 3.75,
    "foto": "fotos/ME916491.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916492",
    "ean": "8055769164922",
    "bestelcode": 216262,
    "naam": "Melissa Borstel Capel Professioneel Soft Touch Zwart 24X4.5",
    "prijs_incl_btw": 8.55,
    "retailprijs_excl_btw": 4.25,
    "foto": "fotos/ME916492.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME916569",
    "ean": "8055769165691",
    "bestelcode": 215475,
    "naam": "Melissa Haarband Haar 1.5Cm",
    "prijs_incl_btw": 4.3,
    "retailprijs_excl_btw": 2.14,
    "foto": "fotos/ME916569.jpg",
    "categorie": "Haarbanden"
  },
  {
    "id": "ME917083",
    "ean": "8055769170831",
    "bestelcode": 216264,
    "naam": "Melissa Borstel Capel Professioneel Soft Touch Zwart 24X6.5",
    "prijs_incl_btw": 9.6,
    "retailprijs_excl_btw": 4.75,
    "foto": "fotos/ME917083.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME917682",
    "ean": "8055769176826",
    "bestelcode": 217092,
    "naam": "Melissa Haarclip 5Cm 6Stuks",
    "prijs_incl_btw": 4.95,
    "retailprijs_excl_btw": 2.45,
    "foto": "fotos/ME917682.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME917689",
    "ean": "8055769176895",
    "bestelcode": 217099,
    "naam": "Melissa Haarclips 7 cm — 30 stuks, zwart",
    "prijs_incl_btw": 3.25,
    "retailprijs_excl_btw": 1.6,
    "foto": "fotos/ME917689.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME917727",
    "ean": "8055769177274",
    "bestelcode": 217182,
    "naam": "Melissa Haarelastiek Haar 2.5Cm 20Stuks Zwart",
    "prijs_incl_btw": 3.55,
    "retailprijs_excl_btw": 1.75,
    "foto": "fotos/ME917727.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME917729",
    "ean": "8055769177298",
    "bestelcode": 217184,
    "naam": "Melissa Haarelastiek Haar 4Cm 8Stuks Zwart",
    "prijs_incl_btw": 3.55,
    "retailprijs_excl_btw": 1.75,
    "foto": "fotos/ME917729.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME917730",
    "ean": "8055769177304",
    "bestelcode": 217185,
    "naam": "Melissa Haarelastiek Haar 5Cm 6Stuks Zwart",
    "prijs_incl_btw": 3.55,
    "retailprijs_excl_btw": 1.75,
    "foto": "fotos/ME917730.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME917737",
    "ean": "8055769177373",
    "bestelcode": 217192,
    "naam": "Melissa Haarelastiek Haar 5Cm 6Stuks Pastel",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.95,
    "foto": "fotos/ME917737.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME917742",
    "ean": "8055769177427",
    "bestelcode": 217197,
    "naam": "Melissa Haarelastiek Haar 2.5Cm 20Stuks Righe",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.95,
    "foto": "fotos/ME917742.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME917792",
    "ean": "8055769177922",
    "bestelcode": 216983,
    "naam": "Melissa Haarelastiek Haar 3.5Cm 25Stuks Zwart",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.95,
    "foto": "fotos/ME917792.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME917802",
    "ean": "8055769178028",
    "bestelcode": 216993,
    "naam": "Melissa Haarelastiek Haar 5Cm 6Stuks",
    "prijs_incl_btw": 3.55,
    "retailprijs_excl_btw": 1.75,
    "foto": "fotos/ME917802.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME919549",
    "ean": "8055769195490",
    "bestelcode": 218233,
    "naam": "Melissa Haarclip Ovale 6.3Cm 5Stuks",
    "prijs_incl_btw": 4.95,
    "retailprijs_excl_btw": 2.45,
    "foto": "fotos/ME919549.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME922109",
    "ean": "8055769221090",
    "bestelcode": 219483,
    "naam": "Melissa Haarelastiek Haar 0.2X4.5Cm 60Stuks Circa",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.95,
    "foto": "fotos/ME922109.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME922209",
    "ean": "8055769222097",
    "bestelcode": 219794,
    "naam": "Melissa Haarkam Fibra Carbonio 22.9X2.6Cm",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME922209.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME922225",
    "ean": "8055769222257",
    "bestelcode": 219727,
    "naam": "Melissa Make-upkwast 95×10 mm — 6 stuks",
    "prijs_incl_btw": 7.75,
    "retailprijs_excl_btw": 3.85,
    "foto": "fotos/ME922225.jpg",
    "categorie": "Make-up"
  },
  {
    "id": "ME926798",
    "ean": "8055769267982",
    "bestelcode": 225683,
    "naam": "Melissa Haarclip 3.5Cm 4Stuks",
    "prijs_incl_btw": 6.6,
    "retailprijs_excl_btw": 3.28,
    "foto": "fotos/ME926798.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME926803",
    "ean": "8055769268033",
    "bestelcode": 225688,
    "naam": "Melissa Haarclip 2.5Cm 4Stuks",
    "prijs_incl_btw": 4.05,
    "retailprijs_excl_btw": 2,
    "foto": "fotos/ME926803.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME926809",
    "ean": "8055769268095",
    "bestelcode": 225694,
    "naam": "Melissa Haarclip 9Cm 2 Stuks",
    "prijs_incl_btw": 12.1,
    "retailprijs_excl_btw": 6,
    "foto": "fotos/ME926809.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME872383",
    "ean": "8057622723833",
    "bestelcode": 239644,
    "naam": "Melissa Borstel C/Specchio M/Legno 24X8Cm",
    "prijs_incl_btw": 8.85,
    "retailprijs_excl_btw": 4.38,
    "foto": "fotos/ME872383.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME872341",
    "ean": "8057622723413",
    "bestelcode": 239342,
    "naam": "Melissa Haarborstel 17X5.5Cm",
    "prijs_incl_btw": 6.05,
    "retailprijs_excl_btw": 3,
    "foto": "fotos/ME872341.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME821350",
    "ean": "8056999213503",
    "bestelcode": 226428,
    "naam": "Melissa Haarborstel 17.5X6.7Cm",
    "prijs_incl_btw": 8.85,
    "retailprijs_excl_btw": 4.38,
    "foto": "fotos/ME821350.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME28624",
    "ean": "8034139286242",
    "bestelcode": 123253,
    "naam": "Melissa Haarborstel S/Touch 23Cm Ovale Ass",
    "prijs_incl_btw": 8.85,
    "retailprijs_excl_btw": 4.38,
    "foto": "fotos/ME28624.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "ME894328",
    "ean": "8054757643289",
    "bestelcode": 238106,
    "naam": "Melissa Haarclip 8Cm",
    "prijs_incl_btw": 5.95,
    "retailprijs_excl_btw": 2.95,
    "foto": "fotos/ME894328.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME44678",
    "ean": "8034139446783",
    "bestelcode": 144373,
    "naam": "Melissa Taglianagels Acciaio Cromato 5.9Cm",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/ME44678.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME45157",
    "ean": "8034139451572",
    "bestelcode": 144415,
    "naam": "Melissa Nageltang Nagels Acciaio Inox 9,2Cm Ass.",
    "prijs_incl_btw": 8.85,
    "retailprijs_excl_btw": 4.38,
    "foto": "fotos/ME45157.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "TMP-240560",
    "ean": "8057622729743",
    "bestelcode": 240560,
    "naam": "Melissa Haarclip bloemen 4 cm — 2 stuks",
    "prijs_incl_btw": 3.3,
    "retailprijs_excl_btw": 1.625,
    "foto": "fotos/TMP-240560.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarclips"
  },
  {
    "id": "ME865246",
    "ean": "8057639652461",
    "bestelcode": 232774,
    "naam": "Melissa Haarclip 8Cm 2 Stuks",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.9500000000000002,
    "foto": "fotos/ME865246.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "TMP-226243",
    "ean": "8056999212520",
    "bestelcode": 226243,
    "naam": "Melissa Haarelastiek Haar 4.5Cm 4Stuks",
    "prijs_incl_btw": 1.45,
    "retailprijs_excl_btw": 0.725,
    "foto": "fotos/TMP-226243.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarelastieken"
  },
  {
    "id": "TMP-217200",
    "ean": "8055769177458",
    "bestelcode": 217200,
    "naam": "Melissa Haarelastiek 4,5 cm — 6 stuks, zwart/wit",
    "prijs_incl_btw": 1.45,
    "retailprijs_excl_btw": 0.725,
    "foto": "fotos/TMP-217200.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarelastieken"
  },
  {
    "id": "ME863358",
    "ean": "8055304633586",
    "bestelcode": 237006,
    "naam": "Melissa Haarelastiek Haar 7.5Cm 4Stuks",
    "prijs_incl_btw": 3.35,
    "retailprijs_excl_btw": 1.6500000000000001,
    "foto": "fotos/ME863358.jpg",
    "categorie": "Haarelastieken"
  },
  {
    "id": "TMP-243907",
    "ean": "8054342296333",
    "bestelcode": 243907,
    "naam": "Melissa Haarclip bloem 4 cm — 2 stuks",
    "prijs_incl_btw": 2.25,
    "retailprijs_excl_btw": 1.125,
    "foto": "fotos/TMP-243907.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarclips"
  },
  {
    "id": "ME835561",
    "ean": "8055954355616",
    "bestelcode": 241358,
    "naam": "Melissa Haarclip 11Cm",
    "prijs_incl_btw": 4.1,
    "retailprijs_excl_btw": 2.04,
    "foto": "fotos/ME835561.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "TMP-230532",
    "ean": "8059793193842",
    "bestelcode": 230532,
    "naam": "Melissa Haarborstel bamboe 21×6,5 cm",
    "prijs_incl_btw": 9.05,
    "retailprijs_excl_btw": 4.5,
    "foto": "fotos/TMP-230532.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarborstels"
  },
  {
    "id": "ME819382",
    "ean": "8059793193828",
    "bestelcode": 230530,
    "naam": "Melissa Haarborstel bamboe 25×8,5 cm",
    "prijs_incl_btw": 9.55,
    "retailprijs_excl_btw": 4.725,
    "foto": "fotos/ME819382.jpg",
    "categorie": "Haarborstels"
  },
  {
    "id": "TMP-239349",
    "ean": "8057622723482",
    "bestelcode": 239349,
    "naam": "Melissa Haarborstel 18.5X7Cm",
    "prijs_incl_btw": 6.3,
    "retailprijs_excl_btw": 3.125,
    "foto": "fotos/TMP-239349.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarborstels"
  },
  {
    "id": "ME821353",
    "ean": "8056999213534",
    "bestelcode": 226506,
    "naam": "Melissa Taglianagels M/Silicone 5.8Cm",
    "prijs_incl_btw": 3.0,
    "retailprijs_excl_btw": 1.5,
    "foto": "fotos/ME821353.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "TMP-234168",
    "ean": "8057639653420",
    "bestelcode": 234168,
    "naam": "Melissa Schaar 9Cm",
    "prijs_incl_btw": 3.55,
    "retailprijs_excl_btw": 1.75,
    "foto": "fotos/TMP-234168.jpg",
    "id_tijdelijk": true,
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME872187",
    "ean": "8057622721877",
    "bestelcode": 239746,
    "naam": "Melissa Pedicure-rasp 24,5×6 cm",
    "prijs_incl_btw": 3.4,
    "retailprijs_excl_btw": 1.6900000000000002,
    "foto": "fotos/ME872187.jpg",
    "categorie": "Nagelverzorging"
  },
  {
    "id": "ME911166",
    "ean": "8055769111667",
    "bestelcode": 209809,
    "naam": "Melissa Spiegel rond met zuignap — 3× vergrotend, 10 cm",
    "prijs_incl_btw": 3.7,
    "retailprijs_excl_btw": 1.8360000000000003,
    "foto": "fotos/ME911166.jpg",
    "categorie": "Accessoires"
  },
  {
    "id": "TMP-137569",
    "ean": "8034139395456",
    "bestelcode": 137569,
    "naam": "Melissa Haarkam voor haarverf 17,5×4 cm — bruin",
    "prijs_incl_btw": 2.5,
    "retailprijs_excl_btw": 1.25,
    "foto": "fotos/TMP-137569.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarkammen"
  },
  {
    "id": "TMP-137570",
    "ean": "8034139395463",
    "bestelcode": 137570,
    "naam": "Melissa Haarkam dubbele vertanding 19×4,2 cm",
    "prijs_incl_btw": 2.5,
    "retailprijs_excl_btw": 1.25,
    "foto": "fotos/TMP-137570.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarkammen"
  },
  {
    "id": "ME39548",
    "ean": "8034139395487",
    "bestelcode": 137572,
    "naam": "Melissa Haarkam Haar Coda Metallo 21.5X2.5Cm",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.4300000000000002,
    "foto": "fotos/ME39548.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "ME72398",
    "ean": "8057622723987",
    "bestelcode": 239797,
    "naam": "Melissa Specchio+Haarkam 18Cm 2 Stuks",
    "prijs_incl_btw": 3.95,
    "retailprijs_excl_btw": 1.9500000000000002,
    "foto": "fotos/ME72398.jpg",
    "categorie": "Haarkammen"
  },
  {
    "id": "TMP-143026",
    "ean": "8034139434056",
    "bestelcode": 143026,
    "naam": "Melissa Poederdons 5,5×0,5 cm — 2 stuks",
    "prijs_incl_btw": 2.25,
    "retailprijs_excl_btw": 1.125,
    "foto": "fotos/TMP-143026.jpg",
    "id_tijdelijk": true,
    "categorie": "Make-up"
  },
  {
    "id": "ME908080",
    "ean": "8055769080802",
    "bestelcode": 205374,
    "naam": "Melissa Make-upkwastenset — 5 stuks",
    "prijs_incl_btw": 4.5,
    "retailprijs_excl_btw": 2.225,
    "foto": "fotos/ME908080.jpg",
    "categorie": "Make-up"
  },
  {
    "id": "TMP-231965",
    "ean": "8059037826093",
    "bestelcode": 231965,
    "naam": "Melissa Gezichtsspons 8×8 cm — 2 stuks",
    "prijs_incl_btw": 2.4,
    "retailprijs_excl_btw": 1.2,
    "foto": "fotos/TMP-231965.jpg",
    "id_tijdelijk": true,
    "categorie": "Sponzen"
  },
  {
    "id": "ME863570",
    "ean": "8055304635702",
    "bestelcode": 236090,
    "naam": "Melissa Douchespons (net) 11 cm — 50 g",
    "prijs_incl_btw": 3.3,
    "retailprijs_excl_btw": 1.625,
    "foto": "fotos/ME863570.jpg",
    "categorie": "Sponzen"
  },
  {
    "id": "TMP-239093",
    "ean": "8057622720412",
    "bestelcode": 239093,
    "naam": "Melissa Haarband Haar 12X2.5Cm",
    "prijs_incl_btw": 2.45,
    "retailprijs_excl_btw": 1.225,
    "foto": "fotos/TMP-239093.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarbanden"
  },
  {
    "id": "ME872817",
    "ean": "8057622728173",
    "bestelcode": 240769,
    "naam": "Melissa Haarclip 6Cm 3Stuks",
    "prijs_incl_btw": 2.35,
    "retailprijs_excl_btw": 1.1700000000000002,
    "foto": "fotos/ME872817.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "ME835405",
    "ean": "8055954354053",
    "bestelcode": 241266,
    "naam": "Melissa Haarclip 3.5Cm 3Stuks",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.4300000000000002,
    "foto": "fotos/ME835405.jpg",
    "categorie": "Haarclips"
  },
  {
    "id": "TMP-243875",
    "ean": "8054342296159",
    "bestelcode": 243875,
    "naam": "Melissa Haarclip zacht 9 cm",
    "prijs_incl_btw": 2.9,
    "retailprijs_excl_btw": 1.45,
    "foto": "fotos/TMP-243875.jpg",
    "id_tijdelijk": true,
    "categorie": "Haarclips"
  },
  {
    "id": "TMP-125129",
    "ean": "8034139300474",
    "bestelcode": 125129,
    "naam": "Melissa Toilettas heren geblokt 27,5×19×7 cm",
    "prijs_incl_btw": 6.8,
    "retailprijs_excl_btw": 3.375,
    "foto": "fotos/TMP-125129.jpg",
    "id_tijdelijk": true,
    "categorie": "Accessoires"
  }
];
