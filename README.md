# Balanesht Konvertor

Currency converter (PLN / BYN / USD) to bottles of "Aur de Balanesht" cognac (0.2 L / 0.5 L) and back.
Pure HTML/CSS/JS, no backend and no build step.

## Structure

- `index.html` — page markup
- `css/styles.css` — styles
- `js/rates.js` — **drink exchange rate** (bottle price for 0.2 L and 0.5 L in each currency)
- `js/app.js` — conversion logic and UI

## How to update the rate

Open `js/rates.js` and change the numbers in `RATES`. Nothing else is needed —
the page will pick up the new values as soon as the file is updated on the server/in the repo.

## Local preview

Just open `index.html` in a browser (double-click / "Open with" → browser).
No server is needed — `rates.js` and `app.js` are included as regular scripts, not
ES modules, so `file://` is not blocked by CORS.

## Deploying to GitHub Pages

1. Create a repository on GitHub and push the contents of this folder there.
2. In the repository: Settings → Pages → Build and deployment → Source: **Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. The site will appear at `https://<username>.github.io/<repo>/` within a minute.

No `.nojekyll` or build step is required — these are static files.

## About a backend (for the future)

The rate is currently hardcoded in `rates.js`, which is a deliberate choice for GitHub Pages (it has no
backend, only static hosting). If you later want to edit the rate without a git push:

- **GitHub Pages + "backend"**: GH Pages itself doesn't support a backend, but you can connect
  an external service (e.g. a small separate API) and call it from `app.js` via `fetch`.
- **Railway / Render / Fly.io** — regular hosting for a Node.js (or any) server.
  You could deploy, for example, an Express service with a `/rates` endpoint and a simple admin panel,
  while keeping the static site on GitHub Pages — the frontend would just fetch the rate from Railway.
- An intermediate option without your own server — store `rates.json` in Google Sheets /
  a GitHub Gist / Cloudflare KV and read it via `fetch` on page load.

For the current scope (3 currencies, 2 bottle sizes), hardcoding in `rates.js` is the simplest
and most maintainable option — no need to change it unless you need to edit the
rate more often than via git.
