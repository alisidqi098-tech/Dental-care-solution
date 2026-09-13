# PRD — Digital Care Solution AI Landing Page

## Problem Statement (original)
Landing page SaaS ad alta conversione per "Dental Care Solution AI". Target: titolari di studi dentistici e direttori sanitari. Obiettivo unico: prenotazione videochiamata demo di 15 minuti. Tema scuro (antracite/blu notte) con accenti neon ciano/verde acqua. Struttura: Hero, Problema (empatia), Soluzione (3 step), Tabella confronto, Social proof/sicurezza, Bottom CTA con calendario prenotazione.

## User Personas
- Titolare di studio dentistico (stressato da telefono/disdette)
- Direttore sanitario di clinica multi-poltrona (focus ROI e gestionale)

## Architecture
- Frontend: React 19 + Tailwind + framer-motion + lenis (smooth scroll), componenti in /app/frontend/src/components/
- Backend: FastAPI (/app/backend/server.py), router /api
- DB: MongoDB via MONGO_URL, collection `demo_bookings`
- Design guidelines: /app/design_guidelines.json

## Core Requirements (static)
1. Hero con headline "Azzera le disdette e libera la tua segreteria dal telefono" + CTA ciano + mockup dashboard/chat WhatsApp in codice
2. Sezione Problema (3 pain point con icone)
3. Soluzione in 3 step (Ascolto Attivo, Caparra Stripe, Sincronizzazione)
4. Tabella Tradizionale vs AI
5. Sezione fiducia (privacy, Stripe, integrazione invisibile)
6. Form prenotazione demo stile Calendly con salvataggio DB
7. CTA con scroll fluido al form

## Implemented (2026-09-13, update 8)
- Ripristinato il blocco mancante del Capitolo 03: ROI calculator interattivo (slider ore poltrona perse → valore recuperabile/mese)
- Footer: aggiunti email (digitalcaresolution24.7@gmail.com), telefono team (+39 327 031 5651), P.IVA 08453291001
- Slot demo: aggiunto 19:30 (DB schedule + default backend/frontend)

## Implemented (2026-09-12, update 7)
- Email di annullamento al medico quando lo stato diventa "annullata" dall'archivio
- Calendario configurabile da /admin: card "Giorni e orari prenotabili" (weekday + slot toggle, PUT /api/admin/schedule protetto, GET /api/schedule pubblico); la landing mostra solo giorni/slot attivi
- Contatore social proof reale nella sezione booking (GET /api/demo-bookings/count, esclude annullate)

## Implemented (2026-09-12, update 6)
- Pulizia dati test: DELETE /api/demo-bookings/{id} protetto + cestino per riga in /admin con conferma
- Anticipo serale: riepilogo team anche alle 20:00 con le demo di DOMANI (marker team_digest_eve_date); endpoint manuale supporta ?tomorrow=true
- Slot occupati: GET pubblico /api/demo-bookings/busy?date=... (esclude annullate); calendario disabilita gli orari presi (barrati, non cliccabili)
- Bugfix: data prenotazione ora calcolata in fuso locale (prima toISOString poteva scalare di un giorno)

## Implemented (2026-09-12, update 5)
- Riepilogo mattutino al team: ogni giorno alle 08:00 (Europe/Rome) email a digitalcaresolution24.7@gmail.com con le demo del giorno (escluse annullate); deduplica via collection settings; endpoint manuale POST /api/admin/send-team-digest + pulsante "Riepilogo oggi" in /admin
- Pagina ringraziamento dedicata /grazie dopo la prenotazione (riepilogo data/ora/studio/email + 3 step "cosa succede ora"), sostituisce la conferma inline

## Implemented (2026-09-12, update 4)
- Export CSV dall'area riservata (pulsante "Esporta CSV", separatore ;, BOM per Excel, include stato e note)
- Note sullo studio: PATCH /api/demo-bookings/{id}/notes (protetto), editor inline espandibile in /admin con anteprima nota
- Infrastruttura link videochiamata nelle email (conferma + promemoria): attiva via env VIDEO_CALL_LINK, fallback al testo attuale finché l'utente non fornisce il link Meet/Zoom
- VINCOLO UTENTE: niente WhatsApp, niente Twilio, richieste demo solo su database

## Implemented (2026-09-12, update 3)
- REBRAND COMPLETO: "Dental Care Solution AI" → "DigitalCareAI" ovunque (logo, footer, tabella confronto, titolo pagina, meta, email, EMAIL_FROM_NAME, API)
- Promemoria automatico 24h prima della demo al medico (loop scheduler ogni 15 min, fuso Europe/Rome, salta annullate, campo reminder_sent_at)
- Stati demo: da_fare/fatta/annullata con PATCH protetto /api/demo-bookings/{id}/status, badge + bottoni rapidi + filtri in /admin
- Notifica WhatsApp: RIMANDATA (utente senza credenziali Twilio per ora)

## Implemented (2026-09-12, update 2)
- Email transazionali (Resend gestito Emergent): conferma automatica al medico + notifica immediata al team (digitalcaresolution24.7@gmail.com) a ogni nuova demo, template HTML italiani con guardrail di sicurezza
- Area Riservata /admin: login JWT (cookie httpOnly, refresh token, blocco brute-force 5 tentativi/15 min), archivio prenotazioni con statistiche e tabella completa (data, ora, studio, contatti, poltrone)
- Admin seed idempotente: alisidqi098@gmail.com (credenziali in /app/memory/test_credentials.md)
- GET /api/demo-bookings ora protetto da autenticazione
- Calendario booking: striscia 30 giorni scrollabile con frecce, fix overflow orizzontale

## Implemented (2026-09-12)
- Hero cinetico: reveal masked line-by-line, mockup WhatsApp auto-play + Dashboard live con tilt 3D parallax e badge fluttuante
- Marquee editoriale lento (compatibilità OrisLine/XDENT/Stripe/GDPR)
- Capitoli numerati 01-05 stile manifesto
- Sezione Problema (40% fuori orario, segreteria interrotta, €350/ora)
- Soluzione 3 step con linea connettiva
- Tabella confronto + strip ROI (-98% no-show, +40% prenotazioni, 3 sec)
- Sezione Affidabilità + 2 testimonianze
- Booking form: picker giorni (12, domeniche escluse), slot orari, dati studio, POST /api/demo-booking, schermata di conferma
- Backend: POST /api/demo-booking, GET /api/demo-bookings
- Lenis smooth scroll + scroll fluido CTA -> #booking

## Verified
- POST/GET /api/demo-booking via curl (booking salvato e riletto da Mongo)
- Flusso e2e via screenshot: selezione giorno+slot, compilazione, submit, messaggio di successo visibile
- Nessuna credenziale/auth richiesta (test_credentials.md vuoto di proposito)

## Backlog
- P1: Promemoria email automatico 24h prima della demo al medico
- P1: Stato demo (da fare / fatta / annullata) modificabile dall'archivio
- P2: Embed Calendly reale opzionale
- P2: Integrazione Stripe reale per caparra simulata in demo
- P2: Multilingua (EN)

## Next Tasks
1. Collegare Resend per conferma email demo
2. Admin dashboard prenotazioni (auth JWT)
3. Pixel/analytics tracciamento conversioni CTA
