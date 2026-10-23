# Mandalario

PWA che genera disegni casuali da stampare e colorare. Tutto gira nel browser, anche offline.

## Forme
- **Mandala** — simmetria circolare. Stili: Fiorito, Geometrico, Misto
  (motivi: petali, foglie, archi, smerli, gocce, triangoli, rombi, perle, fasce, stelle, onde, spirali).
- **Intreccio** — stoffe intrecciate che riempiono il foglio. Stili: Tela (tela, saia, panama, anche in diagonale),
  Onde (strisce ondulate), Cesto (intreccio a tre direzioni con fori esagonali).
- **Muro** — Mattoni (a correre, fiammingo, spina di pesce, cesto, reticolato), Pietre (ciottoli o filari),
  Piastrelle (con piccoli rosoni che si completano tra piastrelle vicine).
- **Escher** — divisioni regolari del piano. La piastrella nasce da un poligono i cui lati sono legati
  da traslazioni, glissoriflessioni, rotazioni attorno ai vertici, mezzi giri attorno ai punti medi
  o assi di simmetria (i tipi isoedrici di Heesch, 19 in tutto, nei gruppi p1, p2, p3, p4, p6, pg, pgg,
  pmg, p4g, p31m, cmm). Stili:
  - *Quadrati*: quadrilateri e triangoli con traslazioni, mezzi giri e glissoriflessioni;
  - *Girandole*: figure che ruotano attorno a centri di ordine 3, 4 o 6;
  - *Esagoni*: esagoni per traslazione, mezzi giri o rotazioni di 120° (come i Rettili di Escher);
  - *Specchi*: figure simmetriche, come il Granchio (pmg) e gli Insetti (p4g) di Escher.

  Spesso la piastrella è divisa in due o tre figure che si incastrano, e le figure orientate in modo
  diverso ricevono decorazioni diverse (squame, strisce, onde, puntini, occhi, spirali, anelli).

Le forme rettangolari riempiono il foglio lasciando una cornice.

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
  stesso codice + stesse impostazioni = stesso disegno.
- Stampa: A4 verticale; mandala di 180 mm, forme rettangolari di 180 × 252 mm. PNG: A4 a 300 dpi. SVG: A4 vettoriale.
- Le icone stanno in `icons/`.
- `sw.js` mette in cache l'app e i font per l'uso offline. Quando modifichi l'app,
  cambia `CACHE` in `sw.js` per forzare l'aggiornamento sui dispositivi.

## Link condivisibili
L'indirizzo della pagina contiene sempre tutto quello che serve a rigenerare il disegno,
e il pulsante **Condividi link** lo invia (telefono) o lo copia (computer). Esempio:

`https://giuseppelevibo.github.io/Mandalario/?f=escher&c=K7Q-2PX&d=3&st=girandole&t=2.4&v=2`

| parametro | significato | valori |
|---|---|---|
| `f` | forma | `mandala`, `intreccio`, `muro`, `escher` |
| `c` | codice | testo libero, fino a 24 caratteri |
| `s` | simmetria (solo mandala) | 5–24 |
| `d` | dettaglio | 1 semplice, 2 medio, 3 ricco |
| `st` | stile | dipende dalla forma (vedi sopra, in minuscolo) |
| `t` | tratto | 1.4–4.4 (unità del disegno: 2.4 ≈ 0,4 mm) |
| `v` | versione del motore | 1 = prima versione, 2 = forme rettangolari, 3 = nuove tassellature Escher (attuale); senza `v` vale 1 |
| `cod=0` | non stampare il codice in fondo al foglio | |

La versione del motore serve a non cambiare i disegni già condivisi: quando una modifica cambierebbe
disegni esistenti, si alza `ENGINE` in `index.html` e si lascia com'è il comportamento per le versioni
precedenti (come fa `STYLES_V1` per i mandala e `tessellateV2` per le tassellature), così i vecchi link
danno ancora lo stesso disegno.
I mandala creati con la prima versione (anche quelli salvati nei "Recenti") restano identici.
