# Mandalario

PWA che genera mandala casuali da stampare e colorare. Tutto gira nel browser, anche offline.

## Pubblicarla
I file vanno serviti via HTTPS (il service worker non funziona aprendo index.html dal disco).

- **GitHub Pages**: l'app è pubblicata su https://giuseppelevibo.github.io/Mandalario/
  dal workflow `.github/workflows/pages.yml`, che parte a ogni push su `main`.
  Da configurare una volta sola: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- **In locale per provarla**: `python3 -m http.server 8000` in questa cartella e apri http://localhost:8000

## Installarla
- Android / Chrome / Edge: menu → "Installa app".
- iPhone / iPad: Safari → Condividi → "Aggiungi alla schermata Home".

## Come funziona
- `index.html` contiene tutta l'app: il motore di generazione (SVG vettoriale) e l'interfaccia.
- Il **codice** (es. `K7Q-2PX` o un nome qualsiasi) inizializza un generatore pseudo-casuale:
  stesso codice + stesse impostazioni = stesso mandala.
- Stampa: A4 verticale, mandala di 180 mm. PNG: A4 a 300 dpi. SVG: A4 vettoriale.
- Le icone stanno in `icons/`.
- `sw.js` mette in cache l'app e i font per l'uso offline. Quando modifichi l'app,
  cambia `CACHE` in `sw.js` per forzare l'aggiornamento sui dispositivi.
