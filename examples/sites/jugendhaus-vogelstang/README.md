# Jugendhaus Vogelstang

Eigenständiges, responsives HTML-Template für das Jugendhaus Vogelstang in
Mannheim. Die Bildreferenz dient als gestalterische Orientierung: große
editoriale Typografie, Papierweiß, Schwarz, Pink und Neon-Limette, klare Raster
und Pixelakzente. Keine Designbilder oder Fotos der Referenz wurden kopiert.
Die Konzertillustration ist eigens für dieses Template erstellt.

## Dateien erzeugen

Im Repository-Stamm:

```powershell
bun run .\examples\sites\jugendhaus-vogelstang\build.ts
bun test .\examples\sites\jugendhaus-vogelstang\template.test.ts
```

Der Generator schreibt neun eigenständige HTML-Seiten und
`jugendhaus-vogelstang.zip` mit allen lokalen Assets. Es gibt keine externen
Fonts, Tracker, Bilddienste oder JavaScript-Abhängigkeiten. Die generierten
HTML-Dateien können direkt bearbeitet werden; ein erneuter Generatorlauf
überschreibt sie. Für dauerhafte Generatoränderungen `build.ts` bearbeiten.

## Lokale Docker-Instanz

```powershell
docker compose -f compose.prod.yml -f compose.sqlite.yml -f compose.build.yml -f compose.jugendhaus.yml up -d --build
```

- Website: http://localhost:3015
- CMS: http://localhost:3015/admin
- Eigenes Compose-Projekt: `jhvogelstang`
- SQLite und Uploads liegen in persistenten, projektspezifischen Docker-Volumes.
- Der Port ist ausschließlich an `127.0.0.1` gebunden, nicht an das Netzwerk.
- Zugangsdaten nur lokal verwenden und vor einem produktiven Einsatz ändern.
- Stoppen: gleicher Compose-Aufruf mit `stop` statt `up -d --build`.
- Kein `down -v` verwenden: das würde die CMS-Daten löschen.

## Dynamische CMS-Installation

Nach der Ersteinrichtung mit dem lokalen Administratorkonto:

```powershell
$env:CMS_EMAIL = 'admin@vogelstang.local'
$env:CMS_PASSWORD = Read-Host 'Lokales Administratorpasswort'
bun run .\examples\sites\jugendhaus-vogelstang\install-cms.ts --verify
Remove-Item Env:\CMS_PASSWORD
```

Das Passwort wird nicht in den Quelldateien gespeichert. Der Installer akzeptiert
nur `localhost` und `127.0.0.1`; `CMS_URL` kann die lokale Adresse überschreiben.
Er importiert die neun Seiten, Medien und drei Detailvorlagen über die normalen
CMS-APIs und legt echte **Content / Post Types** an:

| Content-Typ | Felder zusätzlich zu Titel, Slug, Text und SEO | Detailroute |
| --- | --- | --- |
| Angebote | Bild, Beschreibung, Bereich, wiederholbare Wochenzeiten mit Wochentag, Beginn, Ende und Altersgruppe | `/angebot/<slug>` |
| Veranstaltungen | Bild, Beschreibung, Veranstaltungsdatum, Beginn, Ende, Veranstaltungsort | `/veranstaltung/<slug>` |
| News | Bild, Beschreibung, Rubrik | `/neuigkeit/<slug>` |

Startseite und Übersichten verwenden echte `data.rows`-Loop-Komponenten.
Das Wochenprogramm verwendet die Angebote mit einem verschachtelten
`entry.field`-Loop für die Wochenzeiten. Bildfelder verweisen auf CMS-Medien;
die Detailvorlagen lösen die jeweiligen Content-Felder automatisch auf.

Im CMS unter **Content** den gewünschten Typ auswählen, einen Beitrag anlegen,
Bild und Felder ausfüllen und **Publish** verwenden. Neue Veröffentlichungen,
erneut veröffentlichte Änderungen, Zurückziehen und Löschen aktualisieren die
Website automatisch. Entwürfe und noch nicht veröffentlichte Änderungen bleiben
unsichtbar. Dafür müssen die Seiten nicht erneut veröffentlicht werden.

Der Installer ist für die lokale Erstinstallation und reproduzierbare Tests
gedacht. Ein erneuter Lauf erhält vorhandene Content-Einträge mit gleicher Slug,
ersetzt aber die Vorlagenseiten, deren CSS/JS und die zugehörigen Feldschemata und
veröffentlicht die Seiten. Nicht nach manuellen Layoutänderungen unbedacht erneut
ausführen. `--verify` prüft den Veröffentlichungszyklus aller drei Typen mit
temporären Einträgen, die anschließend wieder gelöscht werden.
Zusätzlich wird eine gepinnte Veröffentlichung auf Position eins geprüft und
die Primärfarbe kurzzeitig geändert: Ein echter Browser prüft die veröffentlichte
Navigation, den Farbstreifen und die Footer-Badges. Die ursprüngliche Farbe wird
anschließend auch bei einem Prüffehler wiederhergestellt.
Der Browser öffnet außerdem den Primärfarben-Token im nativen Framework-Editor.

```powershell
$env:TEMPLATE_BASE_URL = 'http://localhost:3015'
bun test .\examples\sites\jugendhaus-vogelstang\template.test.ts .\examples\sites\jugendhaus-vogelstang\browser.test.ts
```

## HTML-Prototyp separat importieren

1. Ersteinrichtung durchführen und anmelden.
2. Über die Suche (Strg+K) **Import Site** öffnen.
3. `jugendhaus-vogelstang.zip` auswählen.
4. Alle neun Seiten, Styles und Assets übernehmen. Für `style.css` die
   Dateivariante (**Keep as stylesheet**) auswählen, um die komplette CSS-Kaskade
   originalgetreu zu erhalten. Der HTML-Inhalt bleibt visuell bearbeitbar.
5. Den vorhandenen leeren `index` bei einem Erstimport überschreiben.
6. Import abschließen und veröffentlichen. Vor Veröffentlichung bestehender
   Inhalte bei einem erneuten Import Konflikte bewusst prüfen.

Der HTML-ZIP ist ein eigenständig nutzbarer statischer Prototyp, kein vollständiger
CMS-Datenexport. Die Post Types und dynamischen Loops werden durch den oben
beschriebenen Installer eingerichtet.

## Design-Framework und Farben ändern

Auf schmalen Ansichten bis 700 Pixel öffnet **Menü** ein rechts ausgerichtetes,
animiertes Dropdown, ohne den Seiteninhalt zu verschieben. Escape, Klick
außerhalb, Tab aus der Navigation und die Auswahl eines Links schließen es.
Geschlossene Menüpunkte sind nicht fokussierbar. Bei reduzierter Bewegung
entfällt die Animation; ohne JavaScript bleiben alle Navigationslinks sichtbar.

Das native Instatic-Framework enthält unter der Kategorie **Jugendhaus Vogelstang**
die verknüpften Tokens:

| Token | Bedeutung |
| --- | --- |
| `jhv-primary` | Primärfarbe (Limette): Buttons, Farbstreifen, Badges, Markierungen |
| `jhv-secondary` | Zweitfarbe (Pink): Akzente und Fokusmarkierungen |
| `jhv-paper` | Helle Flächen und Text auf dunklen Flächen |
| `jhv-ink` | Dunkle Flächen und Text |
| `jhv-muted` | Zurückhaltender Text |
| `jhv-line` | Trennlinien |

Im **Site**-Editor das **Framework** öffnen, unter **Colors** den passenden
Token ändern und die Website veröffentlichen. Es ist kein Bearbeiten jeder
Seite und kein Docker-Neubau nötig. Die Vorlagen-CSS verknüpft die Tokens über
CSS-Variablen; feste Fallbackwerte dienen nur dem eigenständigen HTML-Prototyp.
In **Type** und **Space** gibt es außerdem die Jugendhaus-Gruppen für
Fließtextgrößen und die responsiven Abschnittsabstände. Bereits bearbeitete
Jugendhaus-Tokens bleiben bei einem Installer-Neulauf erhalten.

Die SVG-Illustrationen und hochgeladenen Content-Bilder sind eigenständige Medien,
keine dynamisch eingefärbten Framework-Elemente. Für ein vollständiges Rebranding
sind diese Medien separat anzupassen. Nach jeder Farbänderung Kontraste prüfen.

## Gepinnte Beiträge

Die vorhandene Ergänzung aus `feat/pinned-news-loops` wurde gezielt übernommen.
Unter **Content → Eintrag → Settings → Keep at top** lässt sich ein Beitrag
anheften. Anschließend den Beitrag veröffentlichen. Alle Content-Loops dieser
Vorlage haben **Pinned entries first** aktiviert; innerhalb der gepinnten und
ungepinnten Gruppen gilt weiter die jeweilige normale Sortierung.
Der HTML-Import unterstützt dafür `data-pinned-first="true"` an `data.rows`-Loops.

## Footer-Badges und eigene Informationsseiten

Sechs eigens gestaltete, dekorative Badges schweben über **VOGELSTANG**. Ein
Tastaturschalter pausiert und setzt die Animation fort. Bei reduzierter Bewegung
bleiben sie unbewegt; ohne JavaScript laufen sie ebenfalls nicht. Für
Screenreader sind die dekorativen Badges ausgeblendet.

Angebots-, Veranstaltungs- und News-Detailseiten bieten statt einer einzelnen
Kontakt-Schaltfläche drei direkte Kanäle: **Mail, Instagram und Telefon**.
Die Icons sind rein dekorative CSS-Zeichnungen ohne externe Bilddienste;
sichtbare Kanalnamen und zugängliche Linkbeschriftungen bleiben erhalten.
Die Schaltflächen sind auch auf dem Smartphone mindestens 44 × 44 Pixel groß.

Die Footer-Links führen auf eigene CMS-Seiten:
`/impressum`, `/datenschutz` und `/barrierefreiheit`. Die Texte sind eigenständig
formulierte **Entwürfe zur Freigabe**, keine kopierten Erklärungen und keine
Rechtsberatung oder ungeprüfte Konformitätszusage. Sie sind im Site-Editor
bearbeitbar. Angaben zu Betreiber, Verantwortung, Datenschutzbeauftragten,
produktivem Hosting, Speicherfristen und Prüfverfahren müssen vervollständigt
werden. Die Bewertung der alten Website wird nicht als Prüfung der neuen
Website ausgegeben.

Faktengrundlagen, Abruf 12.10.2026:
- Stadt und Vertretung: https://www.mannheim.de/de/impressum
- Kontakt und Schlichtungsstelle: https://vogelstang.majo.de/erklaerung-zur-barrierefreiheit
- Datenschutzaufsicht: https://www.baden-wuerttemberg.datenschutz.de/

## Inhaltliche Freigabe

- Echte Adresse, Telefon, E-Mail und Instagram stammen von
  https://vogelstang.majo.de/kontakt.
- Altersgruppen und reguläre/Ferienzeiten stammen von
  https://vogelstang.majo.de/. **Die Kontaktseite nennt am Freitag abweichende
  Zeiten. Das Team muss die Zeiten vor Veröffentlichung bestätigen.**
- Räume und Angebotsmöglichkeiten stammen von
  https://vogelstang.majo.de/haus.
- Teamdaten stammen von https://vogelstang.majo.de/team, Abruf 12.10.2026.
  Aktuelle Besetzung bestätigen. Ausgelaufene BFD- und zeitgebundene
  Studienangaben sind nicht als aktuelle Teammitglieder übernommen.
- Die vorbefüllten Wochenaktivitäten, Veranstaltungen und News sind redaktionelle
  Ausgangsinhalte, keine bestätigten Termine oder Anmeldungen. Vor einem
  öffentlichen Start vollständig prüfen und ersetzen. Auf Wunsch sind die
  sichtbaren Beispielhinweise sowie die kleinen nummerierten Subheader entfernt.
- Initialen sind grafische Platzhalter, keine Porträts. Freigegebene Fotos
  können später im CMS ergänzt werden.
- Vor öffentlichem Betrieb: Impressum, Datenschutz, Barrierefreiheit und
  redaktionelle Inhalte prüfen; `noindex` erst nach Freigabe entfernen.

## Korrektur der Veröffentlichungs-Caches

Der Fork wurde gezielt angepasst: Statisch gebackene Dokumente mit
datenbankgestützten Loops erhalten eine Content-Versionsmarkierung. Nach einer
Content-Veröffentlichung oder einem Zurückziehen wird eine veraltete Datei nicht
mehr ausgeliefert; stattdessen rendert der bestehende versionsabhängige Cache aus
dem **veröffentlichten** Seitensnapshot. Layoutentwürfe bleiben unangetastet.
Auch nach einem Serverneustart können alte Content-Versionen nicht zufällig als
aktuell gelten. Die Ausgabe bleibt vollständiges HTML ohne clientseitige
Nachladepflicht für die Content-Karten.
