# Mandala

Frontend for ISKCON Montreal temple internal organization management. CRM for charity: donors, expenses, members, tax receipts, reports.

## Goal

Make financial truth visible to a non-accountant. Solve one temple's problem perfectly.
- Beautiful enough that seva feels dignified
- Simple enough that next treasurer can start in 5 minutes
- Calm, trustful dashboard
- System outlasts any individual contributor

## Architecture

```
Frontend: Static HTML on GitHub Pages (Jekyll)
Backend:  Goloka — REST API on Mac Mini at https://api.iskconmontreal.ca
Auth:     Google OAuth2 direct + email/password fallback, JWT in localStorage
Cross-domain: CORS + Authorization: Bearer header, no cookies
```

No build step. No bundler. No framework beyond sprae. No Tailwind.

## API

Goloka REST API: `https://api.iskconmontreal.ca`
Swagger: `https://api.iskconmontreal.ca/swagger/index.html`

## Stack

- **Sprae v12.4.7** — DOM microhydration (`lib/sprae.js`). Directives: `:scope`, `:text`, `:if`, `:each`, `:class`, `:onclick`, `:onsubmit`. Loaded with `data-start` attribute for auto-init.
- **Jekyll 4.3** — GitHub Pages hosting. `jekyll-optional-front-matter` plugin so HTML files don't need front matter.
- **CSS custom properties** — Hand-written design tokens in `tokens.css`. Temple-inspired palette: devotional purple `#6b5ce7`, warm neutrals.
- **ES modules** — Vanilla JS, no transpilation.
