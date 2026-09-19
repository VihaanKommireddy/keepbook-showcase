# Keepbook UI voice — implementation notes (F3)

The canonical brand definition is `docs/plan/BRAND.md`. This file is the
working crib sheet for anyone writing strings inside `web/src` — the rules the
design system's own strings follow, verbatim from the canonical doc.

## Rules the DS components already encode

- **Buttons:** verb + object, sentence case (*Import CSV, Add client, Log
  contact, Save changes*). Never *Submit, OK, Yes/No, Got it*. Danger buttons
  repeat the verb + object ("Delete stage"), never "Yes", and live only inside
  a confirm dialog.
- **No exclamation points, no suspense ellipses, no emoji** anywhere in product
  copy. Contractions are fine.
- **Working states** use a gerund ("Importing rows"), `aria-busy`, and show no
  spinner under 150ms; longer work shows real numbers ("Importing row 3,201 of
  8,514").
- **Empty states:** one fact sentence + one action. Filtered-empty names the
  filters and offers "Clear filters".
- **Errors, three parts in order:** what happened (with the value), what state
  the data is in (saved / not saved), what to do next. Errors never live only
  in a toast.
- **Dates** are explicit (*Jun 1, 2026*); money is tabular, right-aligned,
  no decimals unless the source had them; percentages keep their sign (+7.5%).
- **Naming registry** (BRAND §6): Today · Book · Pipeline · Renewals · Radar ·
  Service · Reports · Goals · Settings; Rate Radar, Parked, Lost, Sequences,
  Review changes, Log contact, Saved views, Coverage gaps, Letters, Templates
  with fill-ins, Do not contact, Review ask, Quotes, Search, Import, Export
  everything, Add to calendar (.ics), Open draft / Call / Text.
- **Banned words:** seamless, leverage, empower, robust, supercharge,
  revolutionize, delight, journey, effortless, AI-powered, intelligent, magic,
  best-in-class, all-in-one, game-changer, unlock, elevate.
- **Never referenced anywhere** (matrix OUT): AMS sync, texting/calling from
  Keepbook, email sync, hosted marketing or lead-capture pages, e-signature,
  Zapier, mobile apps, comp plans, premium prediction. No "coming soon" labels.
- **Autopilot is per-client service mail, not marketing** (2026-09-08): the
  "nothing sends by itself" line became "sends on your rules, with a hold, a
  queue, a kill switch, and a digest". Mass email marketing stays banned;
  Autopilot copy names the filing, the source, and the unsubscribe link every
  time.
- **The client's own intake page is not a "hosted page"** (2026-09-09): the ban
  covers marketing sites, public lead-capture forms and booking pages. A client
  reading their own tokenized intake at `/i/:token`, created by their agent, is
  service, and it says so: the page names the agency, names the agent, and
  carries their phone number. No shortened links, no indexing, no page for
  strangers.

## Strings the shell owns

- Wordmark: **Keepbook** (capital K only, one word).
- Version-conflict toast: "This record changed in another tab — reload?" with
  a "Reload" action (ARCHITECTURE §4's dedicated affordance).
- Offline/API failure: "Keepbook isn't responding. Check that the app is
  still running, then try again."
- Route miss: "That screen doesn't exist. Check the address or head back to
  Today."
