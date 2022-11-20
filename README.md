# Planetensystem
**Gruppenmitglieder:** Baldur Siegel, Jannik Herzner, Jonas Straub

## Beschreibung
Eine Web-Applikation die ein Modell eines Planetensystems darstellt.

### Benutzte Technologien
 - [Node.js](https://nodejs.org/en/)
 - [Parcel](https://www.npmjs.com/package/parcel)
 - [Three.js](https://threejs.org/)

### Backend Struktur
Mittels server-side bundling werden die JSX module, HTML und CSS in einheitliche Dateien für den Web Client kompiliert.

#### Projektaufbau
Parcel ermöglicht es, mehrere Libraries wie Three.js und postprocessing sowie eigenen Funktionscode in eine JavaScript Datei zusammenzufügen, aber trotzdem im Backend strukturiert mit Module und und Klassen zu arbeiten.
Zusätzlich dient Parcel als ein einheitliches Tool um solche Web Applikationen zu entwickeln, testen und endgültig kompilieren.

Das Projekt wird zunächst beim `index.html` kompiliert.
Hier werden alle notwendigen Dependencies rekursiv verfolgt, und entsprechend mit verlinkt.
Konkret: die `index.html` verweist auf `style/main.css` und `javascript/index.js`. In der `index.js` wird `Application.js` eingebunden, welches selber die Module `three`, `postprocessing`, `utils`, usw. einbindet. 
Bei ausführen von `npm run dev` oder `npm run build` werden die Module in jeweils eine JS Datei zusammengebracht und in den `/dist` (Distribution) Ordner gebracht mit den zugehörigen HTML und CSS, sowie benötigte Assets wie Bilder oder Fonts.

#### 



## Installation
Zunächst muss [Node.js](https://nodejs.org/en/download/) installiert installiert werden und das Repository lokal geklont sein.
Dann können folgende Kommandos in dem Repository Ordner ausgeführt werden:

``` bash
# Dependencies installieren (only for first time)
npm i

# Development Server starten bei localhost:1234
npm run dev

# Endgültig bauen
npm run build
```
