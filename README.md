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
  cambia la versione di `CACHE` in `sw.js` per forzare l'aggiornamento sui dispositivi,
  mantenendo il prefisso riservato `mandalario-`. L'attivazione elimina solo le vecchie
  cache con questo prefisso: Cache Storage è condiviso con le altre app dello stesso
  origin, anche se i service worker hanno scope diversi.

## Test del service worker

Con Node.js 24, senza installare dipendenze:

```sh
node --check sw.js
node --test tests/sw.test.cjs
```

Gli stessi controlli vengono eseguiti dal workflow `Service worker tests` sulle pull
request e sui push a `main`. I test caricano il vero `sw.js` in un ambiente simulato
e verificano il precache, la rimozione delle sole versioni obsolete di Mandalario,
la conservazione delle cache di MD_Editor (produzione, `/dev/` e nomi precedenti),
di altre app e dei loro contenuti, l'attesa delle cancellazioni prima di
`clients.claim()` e il recupero offline della pagina e di un'icona.
Non costituiscono una prova con due PWA installate in un browser.

### Verifica manuale con entrambe le PWA installate

1. In un profilo browser di prova, servi il branch da verificare in `/Mandalario/`
   e un checkout di MD_Editor in `/MD_Editor/`, sullo **stesso origin**. Per una
   prova desktop locale, esegui `python3 -m http.server 8000` dalla cartella che
   contiene i due repository e apri `http://localhost:8000/MD_Editor/`.
   Per un dispositivo remoto usa HTTPS. Se disponibile, includi anche la copia
   di MD_Editor in `/MD_Editor/dev/`.
2. Apri e installa MD_Editor, carica un documento con anteprima e attendi che il
   suo service worker sia attivo. Annota in DevTools → Application → Cache Storage
   i nomi delle cache e alcune risorse contenute; ripeti per la copia `/dev/`.
   In questa fase verifica già che l'editor e l'anteprima funzionino senza rete,
   poi ripristina la connessione.
3. Nella console dello stesso origin crea una cache obsoleta di prova con
   `await caches.open('mandalario-0.0.0')`. Apri e installa Mandalario con il
   service worker corretto e attendi la sua attivazione. Se era già registrato,
   usa **Update** nel pannello Service Workers; la sola ricarica della pagina
   non garantisce una nuova attivazione se `sw.js` non è cambiato.
4. Controlla che `mandalario-0.0.0` sia sparita, che la cache corrente di Mandalario
   sia presente e che nomi e contenuti delle cache di MD_Editor e delle altre app
   siano rimasti intatti.
5. Disconnetti realmente la rete, chiudi e riapri entrambe le PWA dalle icone di
   installazione. Verifica la generazione di un disegno in Mandalario e l'apertura
   di un documento con anteprima in MD_Editor; ripeti nella copia `/dev/`.
6. Per verificare anche l'aggiornamento, riattiva la rete, cambia **solo nella
   copia locale di prova** la versione di `CACHE`, richiedi l'aggiornamento del
   worker e ripeti i controlli: la precedente cache di Mandalario deve essere
   eliminata e quelle di MD_Editor conservate. Annota browser, versione, sistema
   operativo ed esito; non pubblicare la versione temporanea usata nella prova.

Se una precedente attivazione del worker difettoso ha già eliminato le cache di
MD_Editor, questa correzione non le ricrea: occorre prima ripristinare l'offline
dell'editor online, aggiornando o reinstallando il suo service worker nel profilo
di prova. Dopo il rilascio, ripeti i controlli sul dominio GitHub Pages effettivo.

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
