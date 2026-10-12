import { join } from 'node:path'
import { zipSync } from 'fflate'

const directory = import.meta.dir
export const iconFontPath = 'assets/tabler-contact-3.49.0.woff2'
export const templateAssets = ['assets/stage.svg', iconFontPath, 'assets/tabler-icons-LICENSE.txt']
const navigation = [
  ['index', 'Start'],
  ['wochenprogramm', 'Wochenprogramm'],
  ['veranstaltungen', 'Veranstaltungen'],
  ['angebote', 'Angebote'],
  ['news', 'News'],
  ['team', 'Team'],
]
const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!))

function contactChannels() {
  return `<nav class="contact-channels" aria-label="Kontaktiere das Team">
    <a class="contact-channel" href="mailto:jugendhaus.vogelstang@mannheim.de" aria-label="Schreib uns eine E-Mail"><span class="channel-icon ti-mail" aria-hidden="true"></span><span>Mail</span></a>
    <a class="contact-channel" href="https://www.instagram.com/jugendhausvogelstang/" target="_blank" rel="noopener noreferrer" aria-label="Jugendhaus auf Instagram öffnen (neuer Tab)"><span class="channel-icon ti-brand-instagram" aria-hidden="true"></span><span>Instagram</span></a>
    <a class="contact-channel" href="tel:+496212938285" aria-label="Ruf das Jugendhaus an"><span class="channel-icon ti-phone" aria-hidden="true"></span><span>Telefon</span></a>
  </nav>`
}

function header(slug: string) {
  return `<a class="skip-link" href="#main">Zum Inhalt</a>
  <header class="site-header">
    <a class="brand" href="index.html" aria-label="Jugendhaus Vogelstang – Startseite"><span class="brand-mark" aria-hidden="true"></span><span>JUGENDHAUS<br>VOGELSTANG</span></a>
    <button class="nav-toggle" type="button" aria-controls="navigation" aria-expanded="false">Menü</button>
    <nav class="nav" id="navigation" aria-label="Hauptnavigation">
      ${navigation.map(([id, label]) => `<a href="${id}.html"${slug === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
      <a class="contact-link" href="#kontakt">Komm vorbei ↗</a>
    </nav>
  </header>`
}

function footer() {
  return `<footer class="contact" id="kontakt">
    <div class="contact-top">
      <div><h2>Hey.<br><span>Komm rein.</span></h2>
        <a class="button" href="https://www.google.com/maps/search/?api=1&amp;query=Freiberger+Ring+6+68309+Mannheim" target="_blank" rel="noopener noreferrer">Route zum Jugendhaus <span aria-hidden="true">↗</span></a>
      </div>
      <div><p class="eyebrow">Hier findest du uns</p><address>Jugendhaus Vogelstang<br>Freiberger Ring 6<br>68309 Mannheim</address>
        <p class="small">Im Gebäude des Bürgerdienstes und des Bürgersaals.</p>
        <div class="contact-info">
          <a href="tel:+496212938285">0621 / 293 82 85 ↗</a>
          <a href="mailto:jugendhaus.vogelstang@mannheim.de">jugendhaus.vogelstang@mannheim.de ↗</a>
          <a href="https://www.instagram.com/jugendhausvogelstang/" target="_blank" rel="noopener noreferrer">Instagram / @jugendhausvogelstang ↗</a>
        </div>
        <div class="contact-hours"><p class="eyebrow">Unsere regulären Öffnungszeiten</p>
          <p>Kinder · 6–12 Jahre<br>Mo–Do 15–18 Uhr · Fr 14–17 Uhr</p>
          <p>Teens &amp; junge Erwachsene · 12–27 Jahre<br>Di–Do 18–21 Uhr · Fr 17–20 Uhr</p>
          <details><summary>Öffnungszeiten in den Ferien</summary><p>Kinder: Mo–Do 14–17:30 Uhr · Fr 14–17 Uhr<br>Teens: Di–Do 18–21 Uhr · Fr 17–20:30 Uhr</p></details>
        </div>
      </div>
    </div>
    <div class="footer-bottom"><a class="brand" href="index.html">JUGENDHAUS VOGELSTANG</a>
      <span>Ein Haus. Viele Möglichkeiten. Mannheim / Vogelstang</span>
      <nav class="footer-links" aria-label="Rechtliche Informationen"><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="barrierefreiheit.html">Barrierefreiheit</a></nav>
    </div>
    <div class="footer-playground">
      <p class="footer-word" aria-hidden="true">VOGELSTANG.</p>
      <div class="footer-badges" aria-hidden="true">
        <span class="flying-badge badge-music">Dein Sound</span>
        <span class="flying-badge badge-create">Mach dein Ding</span>
        <span class="flying-badge badge-together">Zusammen hier</span>
        <span class="flying-badge badge-symbol badge-symbol-one">↗</span>
        <span class="flying-badge badge-symbol badge-symbol-two">✳</span>
        <span class="flying-badge badge-symbol badge-symbol-three">+</span>
      </div>
    </div>
  </footer>`
}

function intro(_index: string, title: string, copy: string) {
  return `<div class="page-intro"><div class="intro-line"><h1>${title}</h1><p class="intro-copy">${copy}</p></div></div>`
}

const demoNote = ''
export const offers = [
  { title: 'Musik & Bühne', word: 'LOUD.<br>LIVE.', color: 'pink', meta: 'Tonstudio / Konzertraum', text: 'Deine Stimme, deine Band, dein Sound. Im Haus gibt es ein Tonstudio und einen Konzertraum – für Aufnahmen und die nächste Live-Idee.', extra: 'Recording-Termine und Möglichkeiten für Bands bitte direkt mit dem Team absprechen.' },
  { title: 'Kreativ & selber machen', word: 'MAKE<br>STUFF.', color: 'lime', meta: 'Kreativraum / Werkstatt', text: 'Nähen, malen, basteln oder etwas ganz Eigenes bauen. Im Kreativraum und in der Werkstatt ist Platz zum Ausprobieren.', extra: 'Du hast eine Idee für ein Projekt? Sprich uns an und wir schauen gemeinsam, was möglich ist.' },
  { title: 'Treffen & abschalten', word: 'GOOD<br>TIMES.', color: 'paper', meta: 'Café / Spiele / Leseecke', text: 'Billard, Tischkicker, Air-Hockey, Brettspiele oder einfach quatschen. Im Café und auf der Chillcouch kannst du Zeit mit anderen verbringen.', extra: 'Auch Leseecke, Computerraum und Spielkonsolen gehören zum Haus.' },
  { title: 'Kochen & backen', word: 'TASTE<br>IT.', color: 'lime', meta: 'Küche / Gemeinsam essen', text: 'In der Küche wird gemeinsam gekocht und gebacken. Dabei landet auch Obst und Gemüse aus dem eigenen Dachgarten auf dem Teller.', extra: 'Was gerade gekocht wird und wie du mitmachen kannst, erfährst du vor Ort.' },
  { title: 'Draußen & zusammen', word: 'GROW<br>WITH US.', color: 'paper', meta: 'Dachgarten / Basketball', text: 'Im Dachgarten wachsen kleine Gärten in Kisten. Draußen gibt es außerdem einen Basketballkorb für eine Runde mit Freund*innen.', extra: 'Ob Pflanzen pflegen oder eine Spielrunde starten: Bring dich mit deinen Ideen ein.' },
  { title: 'Deine Idee zählt', word: 'YOUR<br>THING.', color: 'pink', meta: 'Mitreden / Mitgestalten', text: 'Du möchtest ein Angebot anstoßen oder zusammen mit anderen etwas organisieren? Das Jugendhaus bietet Raum für eure Ideen.', extra: 'Am besten kommst du vorbei und erzählst dem Team, was du vorhast.' },
]

function offerCards(all = false) {
  return `<div class="offer-grid">${offers.slice(0, all ? offers.length : 3).map((offer) => `<article class="offer">
    <div class="offer-art art-${offer.color}" aria-hidden="true"><span class="art-orbit"></span><span class="art-orbit art-orbit-two"></span><span class="art-word">${offer.word}</span></div>
    <p class="offer-meta">${escape(offer.meta)}</p><h3>${escape(offer.title)}</h3><p>${escape(offer.text)}</p>
    ${all ? `<p>${escape(offer.extra)}</p>${contactChannels()}` : '<a class="text-link" href="angebote.html">Mehr entdecken ↗</a>'}
  </article>`).join('')}</div>`
}

export const events = [
  ['Live im Jugendhaus', 'Ein Abend für junge Bands und alle, die Livemusik feiern.', 'Musik / Konzert'],
  ['Mach dein Ding', 'Gemeinsam kreativ werden, ausprobieren und eigene Ideen umsetzen.', 'Kreativ / Workshop'],
  ['Zusammen am Tisch', 'Kochen, essen und miteinander ins Gespräch kommen.', 'Community / Aktion'],
]
function eventRows() {
  return `<div class="events">${events.map(([title, text, category], i) => `<article class="event">
    <span class="event-number" aria-hidden="true">0${i + 1}</span><div><h3>${escape(title)}</h3><p>${escape(text)}</p></div>
    <div class="event-status">${escape(category)}<br>Termin offen · nicht bestätigt</div>
    <a class="event-arrow" href="mailto:jugendhaus.vogelstang@mannheim.de?subject=${encodeURIComponent(`Anfrage: ${title}`)}" aria-label="${escape(title)}: beim Team nachfragen">↗</a>
  </article>`).join('')}</div>`
}

export const news = [
  { id: 'deine-ideen', title: 'Was fehlt dir noch?', category: 'Mitgestalten', teaser: 'Ein neues Projekt? Ein Workshop? Ein Nachmittag ganz nach euren Ideen? Deine Vorschläge sind willkommen.', body: 'Bring deine Ideen mit ins Jugendhaus. Gemeinsam schauen wir, welche Projekte und Aktionen wir umsetzen können. Sprich das Team an und gestalte das Haus mit.' },
  { id: 'studio', title: 'Platz für deinen Sound.', category: 'Aus dem Haus', teaser: 'Deine Stimme, deine Instrumente, deine Ideen: Entdecke das Tonstudio im Jugendhaus.', body: 'Im Jugendhaus gibt es ein Tonstudio für junge Musiker*innen. Wenn du Gesang oder Instrumente aufnehmen möchtest, sprich das Team auf einen Recording-Termin an.' },
  { id: 'ferien', title: 'Ferien. Aber nicht langweilig.', category: 'Programm', teaser: 'Auch in den Ferien gibt es Raum für gemeinsame Zeit und eigene Ideen.', body: 'In den Ferien gelten teilweise andere Öffnungszeiten. Welche Aktionen geplant sind und wie du mitmachen kannst, erfährst du direkt beim Team und auf unserem Instagram-Kanal.' },
]
function newsCards() {
  return `<div class="news-grid">${news.map((item) => `<article class="news-item"><span class="badge">Beispielbeitrag</span><p class="eyebrow">${item.category}</p><h3>${item.title}</h3><p>${item.teaser}</p><a class="text-link" href="news.html#${item.id}">Weiterlesen ↗</a></article>`).join('')}</div>`
}

function hoursTable() {
  return `<table class="hours"><caption>Reguläre Öffnungszeiten · außerhalb der Ferien</caption><thead><tr><th scope="col">Tag</th><th scope="col">Kinder · 6–12</th><th scope="col">Teens · 12–27</th></tr></thead><tbody>
    ${['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map((day, index) => `<tr><th scope="row">${day}</th><td>${index === 4 ? '14–17 Uhr' : '15–18 Uhr'}</td><td>${index === 0 ? 'Kein regulärer Treff' : index === 4 ? '17–20 Uhr' : '18–21 Uhr'}</td></tr>`).join('')}
  </tbody></table>`
}

const pages: Record<string, { title: string; description: string; content: string }> = {
  index: {
    title: 'Dein Raum. Dein Ding.',
    description: 'Jugendhaus Vogelstang in Mannheim: dein Treffpunkt für Musik, Kreativität, Spiele und gemeinsame Zeit. Entdecke das Haus und komm vorbei.',
    content: `${intro('Offen für dich', 'Vogelstang.', 'Ein Haus für deine Ideen.<br>Für laute Momente. Und leise.<br>Für dich und deine Leute.')}
    <section class="hero" aria-label="Willkommen im Jugendhaus"><img class="hero-image" src="assets/stage.svg" alt="Illustration einer Konzertbühne in Pink mit Musiker*innen und Publikum" width="1800" height="900" fetchpriority="high">
      <span class="pixel pixel-one" aria-hidden="true"></span><span class="pixel pixel-two" aria-hidden="true"></span>
      <div class="hero-content"><p class="eyebrow">Dein Jugendhaus in Mannheim</p><h2 class="hero-title">DEIN RAUM.<br>DEIN DING.</h2><a class="button" href="wochenprogramm.html">Entdecke dein Programm <span aria-hidden="true">↗</span></a></div>
    </section><div class="ticker"><span>Offen. Gemeinsam. Vogelstang.</span><span>Kinder · Teens · Junge Erwachsene</span><span>Freiberger Ring 6 ↗</span></div>
    <section class="section statement"><p class="section-index">01 / Dein Haus</p><div><h2>Du musst hier nichts sein.<br>Außer <mark>du selbst.</mark> Ob Musik machen, Neues ausprobieren oder einfach mit Freund*innen abhängen: Hier ist Platz für das, was dich bewegt.</h2><a class="text-link" href="team.html">Lerne uns kennen ↗</a></div></section>
    <section class="section dark"><div class="section-heading"><div><p class="section-index">02 / Möglichkeiten statt Langeweile</p><h2>Was geht?<br>Eine ganze Menge.</h2></div><a class="text-link" href="angebote.html">Alle Angebote ↗</a></div>${offerCards()}</section>
    <section class="section program-preview"><div><p class="eyebrow">03 / Deine Woche im Jugendhaus</p><h2>Reinkommen.<br>Mitmachen.</h2><p>Finde Zeit für dein Ding. Das Wochenprogramm zeigt dir, wie eine Woche bei uns aussehen kann.</p><a class="button button-light" href="wochenprogramm.html">Zum Wochenprogramm ↗</a></div><div>${hoursTable()}<p class="small">Zeiten laut bisheriger Startseite. In den Ferien gelten andere Öffnungszeiten.</p></div></section>
    <section class="section"><div class="section-heading"><div><p class="section-index">04 / Zusammen mehr erleben</p><h2>Die nächsten<br>guten Momente.</h2></div><a class="text-link" href="veranstaltungen.html">Veranstaltungen ↗</a></div>${demoNote}${eventRows()}</section>
    <section class="section"><div class="section-heading"><div><p class="section-index">05 / Frisch aus dem Haus</p><h2>Was uns bewegt.</h2></div><a class="text-link" href="news.html">Alle News ↗</a></div>${demoNote}${newsCards()}</section>`,
  },
  angebote: {
    title: 'Angebote',
    description: 'Tonstudio, Kreativraum, Café, Küche, Dachgarten und mehr: Entdecke die Möglichkeiten im Jugendhaus Vogelstang.',
    content: `${intro('02 / Angebote', 'Mach dein Ding.', 'Laut, kreativ, entspannt.<br>Finde deinen Platz und bring<br>deine Ideen mit.')}<div class="ticker"><span>Musik / Kreativität / Community</span><span>Deine Idee zählt ↗</span></div>
    <section class="section">${offerCards(true)}<p class="small muted" style="margin-top:40px">Räume und Möglichkeiten nach der bisherigen Haus-Seite. Verfügbarkeit und konkrete Angebote bitte beim Team erfragen.</p></section>`,
  },
  veranstaltungen: {
    title: 'Veranstaltungen',
    description: 'Platz für Konzerte, Workshops und gemeinsame Aktionen im Jugendhaus Vogelstang. Lokale Entwurfsvorlage mit klar markierten Beispielen.',
    content: `${intro('03 / Veranstaltungen', 'Zusammen laut.', 'Bühne frei für gute Momente.<br>Hier bekommen Konzerte und<br>Aktionen ihren Platz.')}<div class="ticker"><span>Live / Workshops / Aktionen</span><span>Du + deine Leute</span></div>
    <section class="section">${demoNote}${eventRows()}</section>
    <section class="section program-preview"><div><p class="eyebrow">For the Youth</p><h2>Eine Bühne.<br>Für euren Sound.</h2></div><div><p>Im Konzertraum finden gemeinsam mit „For The Youth Concerts“ Musikveranstaltungen statt. Eure Band möchte spielen? Fragt das Team nach den Möglichkeiten.</p><a class="button button-light" href="https://vogelstang.majo.de/for-the-youth-concerts">Zur bisherigen Konzertseite ↗</a></div></section>`,
  },
  news: {
    title: 'News',
    description: 'Neues aus dem Jugendhaus Vogelstang: Platz für Geschichten, Projekte und aktuelle Infos. Beispielbeiträge im lokalen Website-Entwurf.',
    content: `${intro('04 / News', 'Aus dem Haus.', 'Kleine Geschichten.<br>Neue Ideen. Große Pläne.<br>Hier bleibst du auf dem Laufenden.')}<div class="ticker"><span>Geschichten / Projekte / Neuigkeiten</span><span>Vogelstang erzählt</span></div>
    <section class="section">${demoNote}${newsCards()}</section>
    <section class="section">${news.map((item) => `<article class="news-detail" id="${item.id}"><span class="badge">Beispielbeitrag · nicht veröffentlicht</span><h2>${item.title}</h2><p>${item.body}</p><a class="text-link" href="#kontakt">Mehr beim Team erfahren ↗</a></article>`).join('')}</section>`,
  },
}

const activities = [
  ['Kreativ starten', 'Chillen & Spiele'],
  ['Kochen & backen', 'Dein Sound im Studio'],
  ['Spiel & Bewegung', 'Billard & Kicker'],
  ['Werkstatt & Ideen', 'Kreativ am Abend'],
  ['Zusammen ins Wochenende', 'Offener Treff'],
]
pages.wochenprogramm = {
  title: 'Wochenprogramm',
  description: 'Öffnungszeiten und Wochenprogramm-Vorlage für Kinder, Teens und junge Erwachsene im Jugendhaus Vogelstang.',
  content: `${intro('01 / Wochenprogramm', 'Deine Woche.', 'Nach der Schule.<br>Mit deinen Leuten.<br>Mit Platz für spontane Ideen.')}<div class="ticker"><span>Montag bis Freitag</span><span>Einfach mal vorbeikommen ↗</span></div>
  <section class="section">${demoNote}
    <div class="filters" role="group" aria-label="Programm nach Altersgruppe filtern"><button class="filter" data-filter="all" aria-pressed="true" type="button">Alle</button><button class="filter" data-filter="children" aria-pressed="false" type="button">Kinder · 6–12 Jahre</button><button class="filter" data-filter="teens" aria-pressed="false" type="button">Teens · 12–27 Jahre</button></div>
    <p class="small" id="filter-status" role="status" aria-live="polite">9 Programmeinträge angezeigt.</p>
    <div class="week-grid">${['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map((day, i) => `<section class="day"><p class="eyebrow">0${i + 1}</p><h2>${day}</h2>
      <article class="slot" data-audience="children"><time>${i === 4 ? '14:00–17:00' : '15:00–18:00'} Uhr</time><h3>${activities[i][0]}</h3><p>Kinder · 6–12 Jahre</p><span class="badge">Aktivität: Beispiel</span></article>
      ${i > 0 ? `<article class="slot" data-audience="teens"><time>${i === 4 ? '17:00–20:00' : '18:00–21:00'} Uhr</time><h3>${activities[i][1]}</h3><p>Teens &amp; junge Erwachsene · 12–27 Jahre</p><span class="badge">Aktivität: Beispiel</span></article>` : '<p class="small muted">Montags kein regulärer Teenietreff laut bisheriger Startseite.</p>'}
    </section>`).join('')}</div>
  </section><section class="section program-preview"><div><p class="eyebrow">Gut zu wissen</p><h2>Deine Zeit.<br>Unser Haus.</h2><p>Die Zeiten stammen von der bisherigen Startseite. Die Kontaktseite nennt für Freitag abweichende Zeiten; bitte vor Veröffentlichung bestätigen.</p></div><div>${hoursTable()}<p class="small">Die Ferienzeiten findest du unten im Kontaktbereich. Für Sonderveranstaltungen gelten gesonderte Termine.</p><a class="text-link" href="#kontakt">Frag uns direkt ↗</a></div></section>`,
}

const team = [
  ['Tina Menzl', 'TM', 'Sachgebiets- und Bezirksleitung', 'Dipl. Sozialarbeiterin (FH). Laut bisheriger Website seit 2021 für Vogelstang, Feudenheim und Franklin zuständig.', 'lime'],
  ['Stephanie Dicke', 'SD', 'Stellvertretende Hausleitung', 'Dipl. Sozialpädagogin. Steffi kocht gern gemeinsam mit den Kindern und kennt das Haus seit vielen Jahren.', 'pink'],
  ['Niklas Harbourt', 'NH', 'Musik & Kultur', 'Sozialpädagoge (B.A.). Nik organisiert Kulturveranstaltungen und begleitet Konzerte sowie Band-Recordings.', 'paper'],
  ['Frieder Franz', 'FF', 'Pädagogisches Team', 'Sozialpädagoge (B.A.). Laut bisheriger Website seit Juni 2023 im Team – mit Lust aufs Anpacken und Ausprobieren.', 'pink'],
  ['Sophie Reichert', 'SR', 'Medien & gemeinsame Projekte', 'Sozialpädagogin (B.A.). Sophie begeistert sich für Medienprojekte, Backen sowie Computer-, Brett- und Kartenspiele.', 'lime'],
]
pages.team = {
  title: 'Team',
  description: 'Die Menschen hinter dem Jugendhaus Vogelstang. Teamvorstellung nach der bisherigen Website, zur Bestätigung vor Veröffentlichung.',
  content: `${intro('05 / Team', 'Wir sind da.', 'Für deine Fragen.<br>Für deine Ideen.<br>Und einfach zum Quatschen.')}<div class="ticker"><span>Menschen statt Ansprechpartner-Listen</span><span>Lern uns kennen ↗</span></div>
  <section class="section"><p class="demo-note">Teamangaben nach der bisherigen Website, abgerufen am 12.10.2026; aktuelle Besetzung bitte vor Veröffentlichung bestätigen. Die grafischen Initialen sind Platzhalter für freigegebene Teamfotos. Zeitlich ausgelaufene Dienst- und Studienangaben wurden nicht übernommen.</p>
  <div class="team-grid">${team.map(([name, initials, role, text, color]) => `<article class="team-person"><div class="team-portrait art-${color}" aria-hidden="true"><span class="art-orbit"></span><span>${initials}</span></div><h2>${escape(name)}</h2><p class="team-role">${escape(role)}</p><p>${escape(text)}</p></article>`).join('')}</div></section>
  <section class="section program-preview"><div><p class="eyebrow">Dein erster Besuch?</p><h2>Du bist<br>willkommen.</h2></div><div><p>Du willst erst mal wissen, was hier so geht? Ruf an, schreib eine Nachricht oder komm während der Öffnungszeiten vorbei. Das Team hilft dir beim Ankommen.</p><a class="button button-light" href="#kontakt">So erreichst du uns ↗</a></div></section>`,
}

function legalContent(title: string, introduction: string, sections: Array<[string, string]>) {
  return `${intro('', title, introduction)}
    <section class="section legal-layout">
      <aside class="legal-summary"><p class="legal-status"><strong>Entwurf zur Freigabe</strong><br>Diese Informationen müssen vor dem öffentlichen Start durch den Betreiber geprüft und vervollständigt werden.</p>
        <nav aria-label="Auf dieser Seite">${sections.map(([heading], index) => `<a href="#recht-${index + 1}">${heading}</a>`).join('')}</nav>
      </aside>
      <div class="legal-copy">${sections.map(([heading, content], index) => `<section id="recht-${index + 1}"><h2>${heading}</h2>${content}</section>`).join('')}</div>
    </section>`
}

pages.impressum = {
  title: 'Impressum', description: 'Anbieterkennzeichnung und Kontakt für die Website des Jugendhaus Vogelstang.',
  content: legalContent('Impressum.', 'Wer hinter diesem Haus<br>und dieser Website steht.', [
    ['Anbieter dieser Website', '<p>Vorgesehener Anbieter: Stadt Mannheim, Körperschaft des öffentlichen Rechts.</p><address>Stadt Mannheim<br>Rathaus E 5<br>68159 Mannheim</address><p>Vertreten durch Oberbürgermeister Christian Specht.</p><p><strong>Vor Freigabe bestätigen:</strong> Die Stadt Mannheim muss als tatsächliche Betreiberin dieser neuen Website bestätigt werden. Die Angaben zur Vertretung müssen zum Veröffentlichungszeitpunkt aktuell sein.</p>'],
    ['Kontakt zum Jugendhaus', '<address>Jugendhaus Vogelstang<br>Freiberger Ring 6<br>68309 Mannheim</address><p>Telefon: <a href="tel:+496212938285">0621 / 293 82 85</a><br>E-Mail: <a href="mailto:jugendhaus.vogelstang@mannheim.de">jugendhaus.vogelstang@mannheim.de</a></p>'],
    ['Redaktionelle Verantwortung', '<p><strong>Noch festzulegen:</strong> Name und ladungsfähige Anschrift der für redaktionelle Inhalte verantwortlichen Person, soweit eine Benennung nach § 18 Abs. 2 MStV erforderlich ist. Zuständigkeit, Anbieterkennzeichnung und weitere gesetzlich erforderliche Angaben sind durch die Stadt Mannheim zu prüfen.</p>'],
    ['Bilder und Inhalte', '<p>Vor Veröffentlichung müssen die Nutzungsrechte an allen Bildern, Texten und anderen Medien geklärt sein. Das gilt besonders für Personenfotos und Aufnahmen von Kindern und Jugendlichen. Angaben zu Urhebern und erforderliche Bildnachweise sind hier oder unmittelbar beim jeweiligen Medium zu ergänzen.</p>'],
  ]),
}
pages.datenschutz = {
  title: 'Datenschutz', description: 'Informationen zum Umgang mit personenbezogenen Daten auf der Website des Jugendhaus Vogelstang.',
  content: legalContent('Datenschutz.', 'Deine Daten.<br>Transparent erklärt.', [
    ['Verantwortlicher und Datenschutzkontakt', '<p>Vorgesehener Verantwortlicher ist die Stadt Mannheim, Rathaus E 5, 68159 Mannheim. Den Kontakt zum Jugendhaus findest du im <a href="impressum.html">Impressum</a>.</p><p><strong>Noch zu bestätigen:</strong> Verantwortlicher gemäß Art. 4 Nr. 7 DSGVO sowie Name beziehungsweise Stelle und erreichbare Kontaktdaten des Datenschutzbeauftragten. Diese Angaben sind vor dem öffentlichen Start zu ergänzen.</p>'],
    ['Aufruf der Website und Hosting', '<p>Damit die Website ausgeliefert werden kann, erhält der Webserver technische Verbindungsdaten, insbesondere die IP-Adresse. Ob und wie lange Zugriffsprotokolle gespeichert werden, hängt von der tatsächlichen Hosting-Konfiguration ab.</p><p><strong>Noch zu ergänzen:</strong> Hosting-Anbieter und Standort, verarbeitete Daten, Zwecke, Rechtsgrundlagen, Empfänger, Löschfristen sowie gegebenenfalls Auftragsverarbeitung und Übermittlungen außerhalb der EU beziehungsweise des EWR. Die lokale Testinstanz ist keine Beschreibung des späteren Produktivbetriebs.</p>'],
    ['Cookies, Analyse und eingebundene Dienste', '<p>Die öffentliche Seitenvorlage lädt keine externen Schriftarten, Analyse-Tracker, Karten oder Instagram-Beiträge ein. Der Verwaltungsbereich verwendet ein Sitzungscookie für die Anmeldung. Die öffentliche Website benötigt für das mobile Menü, die Programmfilter und die Footer-Animation keine Cookies oder dauerhafte Speicherung im Browser.</p><p>Zusätzliche Plugins, Hosting-Dienste oder später eingebundene Inhalte können dieses Verhalten ändern. Vor Freigabe sind die tatsächlichen Dienste, erforderliche Einwilligungen, Cookie-Laufzeiten und Rechtsgrundlagen zu dokumentieren.</p>'],
    ['Kontaktaufnahme und externe Links', '<p>Wenn du uns eine E-Mail schreibst oder anrufst, werden die von dir mitgeteilten Daten zur Bearbeitung deiner Anfrage benötigt. Rechtsgrundlage, zuständige Stelle und Aufbewahrungsdauer sind vor Veröffentlichung durch den Verantwortlichen festzulegen.</p><p>Instagram und die Routenplanung sind ausschließlich externe Links. Erst wenn du einen solchen Link öffnest, verlässt du diese Website und rufst den jeweiligen Anbieter auf. Dort gelten dessen Datenschutzinformationen.</p>'],
    ['Deine Rechte', '<p>Je nach Voraussetzungen hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine erteilte Einwilligung kann für die Zukunft widerrufen werden. Du kannst dich außerdem bei einer Datenschutzaufsichtsbehörde beschweren.</p><p>Für Baden-Württemberg: <a href="https://www.baden-wuerttemberg.datenschutz.de/">Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg</a>. Ergänze vor Freigabe einen verbindlichen Kontakt für die Ausübung deiner Rechte.</p>'],
    ['Geltungsbereich und Aktualisierung', '<p>Diese Seite ist ein redaktioneller Entwurf für die neue Jugendhaus-Website und keine abschließend geprüfte Datenschutzerklärung. Nach Festlegung der produktiven Domain, des Hostings und aller eingesetzten Dienste ist sie fachlich zu prüfen. Datum der letzten Prüfung und Geltungsbereich sind dann einzutragen.</p>'],
  ]),
}
pages.barrierefreiheit = {
  title: 'Barrierefreiheit', description: 'Zugänglichkeit, Rückmeldung und Kontakt zur Barrierefreiheit der neuen Jugendhaus-Website.',
  content: legalContent('Für alle da.', 'Informationen zur<br>digitalen Barrierefreiheit.', [
    ['Geltungsbereich und Prüfstatus', '<p>Diese Erklärung ist für die neue Website des Jugendhaus Vogelstang vorgesehen. Die produktive Internetadresse ist vor Veröffentlichung einzutragen. Maßgeblich sind die für den öffentlichen Betreiber geltenden Anforderungen, insbesondere das Landes-Behindertengleichstellungsgesetz Baden-Württemberg.</p><p><strong>Noch nicht abschließend geprüft:</strong> Ein formaler Konformitätsstatus wird nicht behauptet. Die Bewertung der bisherigen Website lässt sich nicht auf dieses neue Design übertragen. Vor Freigabe sind die anwendbaren Anforderungen, Prüfmethoden, Prüfergebnisse und das Prüfdatum festzuhalten.</p>'],
    ['Unterstützung bei der Nutzung', '<p>Die Vorlage bietet semantische Seitenbereiche, einen Sprunglink zum Hauptinhalt, sichtbare Tastaturfokusse und eine per Tastatur bedienbare Navigation. Das Layout passt sich an schmale Bildschirme an. Die rein dekorativen Footer-Badges sind für Screenreader ausgeblendet.</p><p>Ist auf deinem Gerät reduzierte Bewegung eingestellt, bleiben die Badges von Anfang an unbewegt. Diese Funktionen ersetzen keine vollständige Barrierefreiheitsprüfung.</p>'],
    ['Noch zu prüfen und zu verbessern', '<p>Vor dem öffentlichen Start sind unter anderem Farbkontraste, Vergrößerung, Tastaturbedienung, Screenreader-Nutzung, verständliche Texte und alternative Bildbeschreibungen zu prüfen. Später hochgeladene Dokumente, Videos oder neue Farben müssen ebenfalls überprüft werden. Bekannte Einschränkungen und ein Zeitplan für ihre Behebung sind nach der Prüfung konkret hier zu dokumentieren.</p>'],
    ['Barrieren melden', '<p>Wenn du eine Barriere bemerkst oder Informationen in einer besser zugänglichen Form benötigst, melde dich beim Jugendhaus:</p><p><a href="mailto:jugendhaus.vogelstang@mannheim.de?subject=Barriere%20auf%20der%20Website">jugendhaus.vogelstang@mannheim.de</a><br><a href="tel:+496212938285">0621 / 293 82 85</a></p><p>Nenne möglichst die betroffene Seite und beschreibe das Problem. Eine zuständige Ansprechstelle und das verbindliche Rückmeldeverfahren müssen durch den Betreiber bestätigt werden.</p>'],
    ['Schlichtungsverfahren', '<p>Wenn eine Rückmeldung zur Barrierefreiheit nicht zufriedenstellend beantwortet wird, kommt ein Schlichtungsverfahren beim Landeszentrum Barrierefreiheit Baden-Württemberg in Betracht. Voraussetzungen und Kontaktdaten sind vor der Freigabe zu prüfen.</p><p>Landeszentrum Barrierefreiheit · Schlichtungsstelle<br>Else-Josenhans-Straße 6 · 70173 Stuttgart<br>Telefon: 0711 / 123 39375<br>E-Mail: <a href="mailto:schlichtung@barrierefreiheit.bwl.de">schlichtung@barrierefreiheit.bwl.de</a><br><a href="https://barrierefreiheit-bw.de/">Informationen zum Schlichtungsverfahren</a></p>'],
  ]),
}

function renderPage(slug: string, page: { title: string; description: string; content: string }) {
  const content = page.content
    .replace(/<p class="(?:eyebrow|section-index|demo-note)"[^>]*>[\s\S]*?<\/p>/g, '')
    .replace(/<span class="badge">[\s\S]*?<\/span>/g, '')
    .replace(/<p class="small(?: muted)?"[^>]*>(?:Räume und Möglichkeiten|Zeiten laut|Die Ferienzeiten)[\s\S]*?<\/p>/g, '')
    .replace('Die Zeiten stammen von der bisherigen Startseite. Die Kontaktseite nennt für Freitag abweichende Zeiten; bitte vor Veröffentlichung bestätigen.', 'Für spontane Ideen ist immer Platz. Frag uns, was in dieser Woche im Haus los ist.')
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(page.title)} | Jugendhaus Vogelstang</title>
  <meta name="description" content="${escape(page.description)}">
  <meta name="theme-color" content="#c5ff46">
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="style.css">
  <script src="site.js" defer></script>
</head>
<body>
  ${header(slug)}
  <main id="main">${content}</main>
  ${footer()}
</body>
</html>
`
}

export function renderStaticPages() {
  return Object.fromEntries(Object.entries(pages).map(([slug, page]) => [slug, renderPage(slug, page)]))
}

function contentLoop(tableId: string, className: string, card: string, limit: number, order = 'createdAt', direction = 'asc') {
  return `<instatic-loop class="${className}" data-source-id="data.rows" data-table-id="${escape(tableId)}" data-pinned-first="true" data-order-by="${order}" data-direction="${direction}" data-limit="${limit}">${card}</instatic-loop>`
}

const weeklySlots = `<instatic-loop class="weekly-slots" data-source-id="entry.field" data-field-id="weeklySlots" data-direction="asc" data-limit="50">
  <p class="weekly-time" data-audience="{currentEntry.audience}"><strong>{currentEntry.weekday}</strong><br>{currentEntry.startTime}–{currentEntry.endTime} Uhr<br><span class="small">{currentEntry.ageGroup}</span></p>
</instatic-loop>`

export function renderCmsPages(tableIds: { angebote: string; veranstaltungen: string; news: string }) {
  const offerCard = `<article class="offer"><a href="{currentEntry.permalink}"><img class="content-image" src="{currentEntry.featuredMedia}" alt="{currentEntry.title}" width="800" height="600" loading="lazy"></a><p class="offer-meta">{currentEntry.category}</p><h3><a href="{currentEntry.permalink}">{currentEntry.title}</a></h3><p>{currentEntry.description}</p>${weeklySlots}<a class="text-link" href="{currentEntry.permalink}">Mehr entdecken ↗</a></article>`
  const eventCard = `<article class="event-card"><a href="{currentEntry.permalink}"><img class="content-image" src="{currentEntry.featuredMedia}" alt="{currentEntry.title}" width="800" height="600" loading="lazy"></a><p class="date-meta">{currentEntry.eventDate:date(de-DE,long)} · {currentEntry.startTime} Uhr</p><h3><a href="{currentEntry.permalink}">{currentEntry.title}</a></h3><p>{currentEntry.description}</p><p class="small">{currentEntry.startTime}–{currentEntry.endTime} Uhr · {currentEntry.location}</p><a class="text-link" href="{currentEntry.permalink}">Alle Infos ↗</a></article>`
  const newsCard = `<article class="news-item"><a href="{currentEntry.permalink}"><img class="content-image" src="{currentEntry.featuredMedia}" alt="{currentEntry.title}" width="800" height="600" loading="lazy"></a><p class="date-meta">{currentEntry.publishedAt:date(de-DE,long)}</p><h3>{currentEntry.title}</h3><p>{currentEntry.description}</p><a class="text-link" href="{currentEntry.permalink}">Weiterlesen ↗</a></article>`
  const result: Record<string, string> = {}
  for (const [slug, page] of Object.entries(pages)) {
    let content = page.content
      .replace(offerCards(), contentLoop(tableIds.angebote, 'offer-grid', offerCard, 3))
      .replace(offerCards(true), contentLoop(tableIds.angebote, 'offer-grid', offerCard, 100))
      .replace(eventRows(), contentLoop(tableIds.veranstaltungen, 'event-grid', eventCard, slug === 'index' ? 3 : 100, 'cell:eventDate'))
      .replace(newsCards(), contentLoop(tableIds.news, 'news-grid', newsCard, slug === 'index' ? 3 : 100, 'publishedAt', 'desc'))
    if (slug === 'news') content = content.replace(/<section class="section"><article class="news-detail"[\s\S]*?<\/section>/, '')
    if (slug === 'wochenprogramm') {
      const programCard = `<article class="program-offer"><h2><a href="{currentEntry.permalink}">{currentEntry.title}</a></h2><p>{currentEntry.description}</p>${weeklySlots}</article>`
      content = content.replace(/<div class="week-grid">[\s\S]*?<\/div>\s*<\/section>/, `${contentLoop(tableIds.angebote, 'program-grid', programCard, 100)}</section>`)
        .replace('9 Programmeinträge angezeigt.', '')
    }
    result[slug] = renderPage(slug, { ...page, content })
  }
  for (const [slug, title, specific] of [
    ['angebot-detail', 'Angebot', weeklySlots],
    ['veranstaltung-detail', 'Veranstaltung', '<p class="detail-time">{currentEntry.eventDate:date(de-DE,full)}<br>{currentEntry.startTime}–{currentEntry.endTime} Uhr<br>{currentEntry.location}</p>'],
    ['news-detail', 'News', '<p class="small">{currentEntry.publishedAt:date(de-DE,long)}</p>'],
  ]) {
    result[slug] = renderPage(slug, { title, description: 'Jugendhaus Vogelstang', content: `<div class="page-intro"><h1>{currentEntry.title}</h1></div><section class="section detail-layout"><img class="content-image detail-image" src="{currentEntry.featuredMedia}" alt="{currentEntry.title}" width="800" height="600"><div><p class="detail-description">{currentEntry.description}</p>${specific}<instatic-outlet></instatic-outlet>${contactChannels()}</div></section>` })
  }
  return result
}

if (import.meta.main) {
  const rendered = renderStaticPages()
  for (const [slug, html] of Object.entries(rendered)) await Bun.write(join(directory, `${slug}.html`), html)
  const bundle: Record<string, Uint8Array> = {}
  for (const file of [...Object.keys(rendered).map((slug) => `${slug}.html`), 'style.css', 'site.js', ...templateAssets]) {
    bundle[file] = new Uint8Array(await Bun.file(join(directory, file)).arrayBuffer())
  }
  await Bun.write(join(directory, 'jugendhaus-vogelstang.zip'), zipSync(bundle))
  console.info(`Built ${Object.keys(rendered).length} HTML pages and the self-contained import archive.`)
}
