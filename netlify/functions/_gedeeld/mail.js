// ============================================================
//  _gedeeld/mail.js  —  gedeelde code, GEEN eigen functie
//  Verstuurt een mail via je eigen Combell-mailbox (info@heyestore.be),
//  net alsof je hem zelf vanuit je mailprogramma verstuurt.
//
//  Nodig in Netlify (Environment variables):
//    SMTP_WACHTWOORD   het wachtwoord van de mailbox  (VERPLICHT)
//  Optioneel, enkel als het anders moet dan de standaard:
//    SMTP_GEBRUIKER    standaard: het e-mailadres uit instellingen.js (bedrijf.email)
//    SMTP_HOST         standaard: smtp-auth.mailprotect.be  (Combell)
//    SMTP_POORT        standaard: 587
// ============================================================

import nodemailer from "nodemailer";

export async function verstuurMail({ van, aan, onderwerp, tekst, html }) {
  // Tijdens het testen sturen we niets echt weg
  if (globalThis.__testMail) return globalThis.__testMail({ van, aan, onderwerp, tekst, html });

  const wachtwoord = process.env.SMTP_WACHTWOORD;
  if (!wachtwoord) throw new Error("SMTP_WACHTWOORD ontbreekt in Netlify");

  const poort = Number(process.env.SMTP_POORT) || 587;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-auth.mailprotect.be",
    port: poort,
    secure: poort === 465,          // 465 = meteen versleuteld, 587 = versleuteld na STARTTLS
    requireTLS: poort !== 465,      // nooit onversleuteld versturen
    auth: { user: process.env.SMTP_GEBRUIKER || van.adres, pass: wachtwoord },
    // Een Netlify-functie mag maar ±10 seconden duren: niet eindeloos wachten
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000
  });

  await transport.sendMail({
    from: { name: van.naam, address: van.adres },
    replyTo: van.adres,
    to: aan,
    subject: onderwerp,
    text: tekst,
    html: html
  });
}

