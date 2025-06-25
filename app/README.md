# Deutsch-Vietnamesischer Vokabeltrainer

## Übersicht

Der Deutsch-Vietnamesische Vokabeltrainer ist eine moderne Node.js-Webanwendung, die das Erlernen von deutsch-vietnamesischen Vokabelpaaren durch verschiedene interaktive Lernmethoden unterstützt. Die Anwendung bietet Funktionen wie Kartentraining, Text-to-Speech und benutzerdefinierte Übungssequenzen.

Die Anwendung ist privat und befindet sich noch in einer sehr frühen Entwicklungsphase.
Sie soll später für weitere Sprachenpaare anpassbar sein.

Die Anwendung wurde bisher nur unter Ubuntu 24.04. getestet.

## Installation und Einrichtung

### Voraussetzungen

- Node.js (Version 16 oder höher)
- MongoDB
- Google TTS API-Key (für die Text-to-Speech Funktionalität)

### Installation

1. Repository klonen oder entpacken
2. Abhängigkeiten installieren:
   ```
   npm install
   ```
3. Konfigurationsdateien einrichten:
   - `config/database.js` mit MongoDB-Verbindungsdaten
   - `config/googleapikey.json` mit dem Google TTS API-Key
   
   **Wichtiger Hinweis**: Die Configdateien müssen manuell im übergeordneten Verzeichnis "../config/database.js" und "../config/googleapikey.json" angelegt werden. Beispiele dazu befinden sich in "./docs/".

4. Server starten:
   ```
   npm start
   ```

## Wichtiger Hinweis: Migration zur MongoDB-Datenbank

**Die Verwendung von JSON-Dateien für Vokabellisten ist veraltet und wird nur noch für die Abwärtskompatibilität unterstützt!**

Alle neuen Vokabellisten sollten in der MongoDB-Datenbank gespeichert werden. Um bestehende JSON-Vokabellisten zu importieren, verwenden Sie das Import-Skript:

```
npm run import-vocabulary
```

Dieses Skript liest alle JSON-Dateien aus dem `vocabulary/`-Verzeichnis und importiert sie in die MongoDB-Datenbank. Nach dem Import können Sie weiterhin auf Ihre Vokabellisten zugreifen, aber alle Änderungen werden nun in der Datenbank gespeichert.

## Datenbank-Setup mit Docker

Im Ordner `docs/db/` befindet sich eine `docker-compose.yml`-Datei, mit der Sie schnell und einfach eine MongoDB-Instanz und Mongo Express als Administrationsoberfläche starten können:

```
cd docs/db/
docker-compose up -d
```

Dies startet eine MongoDB-Instanz auf Port 27017 und Mongo Express auf Port 8081. Die Datenbank wird im Unterordner `./data` persistent gespeichert.

## Projektstruktur

Die Anwendung ist modular aufgebaut und folgt einer klaren Strukturierung:

```
├── app.js                  # Hauptanwendungsdatei
├── database/               # Datenbankverbindung und -modelle
│   ├── db-connection.js    # MongoDB-Verbindungsverwaltung
│   ├── handlers/           # Datenbankhandler
│   ├── models/             # Datenmodelle
│   └── utils/              # Datenbank-Hilfsfunktionen
├── public/                 # Client-seitige Ressourcen
│   ├── audio/              # Generierte Audiodateien
│   ├── css/                # Stylesheets
│   └── js/                 # Client-seitige JavaScript-Dateien
├── routes/                 # API-Routen
│   ├── tts.js              # Text-to-Speech API-Endpoints
│   └── vocabulary.js       # Vokabel-API-Endpoints
├── scripts/                # Hilfsskripte
│   └── import-vocabulary.js # Importskript für Vokabellisten
├── services/               # Backend-Dienste
│   └── tts-service.js      # Text-to-Speech-Service
├── utils/                  # Hilfsfunktionen
│   ├── json-parser.js      # JSON-Parser (veraltet)
│   └── track-parser.js     # Parser für Track-Definitionen
├── views/                  # HTML-Templates
│   ├── components/         # Wiederverwendbare UI-Komponenten
│   ├── layouts/            # Seitenlayouts
│   └── pages/              # Einzelseiten
└── vocabulary/             # Vokabellisten im JSON-Format (veraltet)
```

## Hauptfunktionen

### 1. Vokabellisten verwalten

Die Anwendung ermöglicht das Erstellen, Bearbeiten und Löschen von Vokabellisten. Jede Liste enthält Wortpaare mit deutscher und vietnamesischer Übersetzung.

#### Vokabeleditor (`/vocabulary-editor`)
- Erstellen neuer Vokabellisten
- Direkte Eingabe von Wortpaaren
- Automatische Speicherung in der MongoDB-Datenbank

### 2. Vokabellisten anzeigen und lernen (`/vocabulary-lists`)

- Übersicht über alle verfügbaren Vokabellisten
- Detailansicht einer einzelnen Liste mit allen Wortpaaren
- Audio-Wiedergabe einzelner Wörter oder der gesamten Liste
- Einstellbare Parameter:
  - Stimmentyp (männlich/weiblich/neutral)
  - Sprechgeschwindigkeit (0.25 bis 4.0)

### 3. Kartentrainer (`/vocab-trainer`)

Der Kartentrainer ist eine interaktive Lernmethode, die auf dem Konzept der Lernkarten basiert:

- Anzeige von Wörtern auf virtuellen Karten
- Umdrehen der Karten zur Überprüfung
- Markieren von Wörtern als "bekannt" oder "unbekannt"
- Intelligente Wiederholung (bekannte Wörter werden seltener angezeigt)
- Audio-Unterstützung für die korrekte Aussprache

### 4. Freitext zu Sprache (`/text-to-speech`)

Konvertiert beliebigen Text in gesprochene Sprache:

- Unterstützung für Deutsch und Vietnamesisch
- Anpassbare Sprechgeschwindigkeit und Stimmentyp
- Download-Möglichkeit für generierte Audiodateien

### 5. Track-Editor

Mit dem Track-Editor können benutzerdefinierte Übungssequenzen erstellt werden:

- Kombination von deutschen und vietnamesischen Wörtern
- Einfügung von Pausen zwischen den Wörtern
- Anpassbare Geschwindigkeit für jeden Teil der Sequenz
- Syntax: `DE(1.0) Pause (2s) VN(0.8) Pause (5s)`

## Verwendete Technologien

### Backend
- **Node.js** - JavaScript-Laufzeitumgebung
- **Express.js** - Web-Framework
- **MongoDB** - NoSQL-Datenbank
- **Google Text-to-Speech API** - Sprachsynthese

### Frontend
- **HTML5/CSS3** - Markup und Styling
- **JavaScript (ES6+)** - Client-seitige Funktionalität
- **EJS** - Template-Engine

## API-Endpunkte

### Text-to-Speech API
- `GET /api/tts/lists` - Liste aller verfügbaren Vokabellisten
- `GET /api/tts/list/:filename` - Details einer bestimmten Vokabelliste
- `POST /api/tts/generate-word` - Generiert Audio für ein einzelnes Wort
- `POST /api/tts/generate/:filename` - Generiert Audio für eine gesamte Vokabelliste
- `POST /api/tts/generate-track` - Generiert Audio für einen benutzerdefinierten Track
- `POST /api/tts/generate-freitext` - Generiert Audio für einen freien Text

### Vokabel-API
- `POST /api/vocabulary/save` - Speichert eine neue oder aktualisiert eine bestehende Vokabelliste
- `GET /api/vocabulary/lists` - Liste aller verfügbaren Vokabellisten
- `GET /api/vocabulary/list/:name` - Details einer bestimmten Vokabelliste
- `DELETE /api/vocabulary/list/:name` - Löscht eine Vokabelliste

## Architekturansatz

Die Anwendung folgt einer modularen Architektur mit klarer Trennung von Verantwortlichkeiten:

1. **Datenmodell-Schicht**: MongoDB-Schema und Zugriffsmethoden
2. **Service-Schicht**: Geschäftslogik und externe API-Integration
3. **Controller-Schicht**: API-Endpunkte und Anfrageverarbeitung
4. **Präsentations-Schicht**: Frontend-UI und Benutzerinteraktion

Die klare Modularisierung ermöglicht eine einfache Wartung und Erweiterung der Anwendung.

## Erweiterungsmöglichkeiten

1. **Benutzerauthentifizierung**: Persönliche Vokabellisten und Lernfortschritte
2. **Weitere Sprachen**: Unterstützung zusätzlicher Sprachpaare
3. **Lernstatistiken**: Detaillierte Auswertung des Lernfortschritts
4. **Offline-Modus**: Lokale Speicherung für die Nutzung ohne Internetverbindung
5. **Mobile App**: Native Anwendung für iOS und Android

## Fehlerbehandlung

Bei Problemen mit der Anwendung können folgende Schritte hilfreich sein:

1. Überprüfen Sie die MongoDB-Verbindung
2. Stellen Sie sicher, dass der Google TTS API-Key gültig ist
3. Prüfen Sie die Konsolenausgabe auf Fehlermeldungen
4. Bei Problemen mit dem Import von Vokabellisten überprüfen Sie das Format der JSON-Dateien

## Fazit

Der Deutsch-Vietnamesische Vokabeltrainer bietet eine umfassende Lösung für das Erlernen von Vokabeln mit Unterstützung moderner Technologien wie Sprachsynthese und interaktiven Lernmethoden. Die modulare Architektur ermöglicht eine einfache Erweiterung und Anpassung an individuelle Bedürfnisse.

---

*Diese Dokumentation bezieht sich auf die Version vom April 2025.*

*Hinweis: Diese Dokumentation und das Projekt wurden mithilfe von Claude, einem fortschrittlichen KI-Assistenten von Anthropic, erstellt.*


### References

1. **Docker Compose - Wo befindet sich die YML Konfigurations Datei · evcc-io/evcc · Discussion #6494**. [https://github.com](https://github.com/evcc-io/evcc/discussions/6494)
2. **Docker Compose | Docker Docs**. [https://docs.docker.com](https://docs.docker.com/compose/)
3. **Manual setup guide | Google Tag Manager - Server-side | Google for Developers**. [https://developers.google.com](https://developers.google.com/tag-platform/tag-manager/server-side/manual-setup-guide)
4. **Komplette docker-compose.yml für das Setup 2018 · GitHub**. [https://gist.github.com](https://gist.github.com/eS-IT/1147f9ce40f2245a45e77947ae1546e0)
5. **Docker Compose: Ein Quick Start Guide - Mobile FHSTP MKL**. [https://mfg.fhstp.ac.at](https://mfg.fhstp.ac.at/development/webdevelopment/docker-compose-ein-quick-start-guide/)
6. **./docker-compose.yml is invalid because: Unsupported config option for services.app: 'db' - General - Docker Community Forums**. [https://forums.docker.com](https://forums.docker.com/t/docker-compose-yml-is-invalid-because-unsupported-config-option-for-services-app-db/131177)
7. **How to use Compose in Docker - IONOS**. [https://www.ionos.com](https://www.ionos.com/digitalguide/server/configuration/docker-compose-tutorial/)
8. **Use Volumes in Docker Compose To Manage Persistent Data**. [https://kinsta.com](https://kinsta.com/blog/docker-compose-volumes/)
9. **Einführung in Docker Compose**. [https://appmaster.io](https://appmaster.io/blog/docker-compose)
10. **Running ONLYOFFICE Docs using Docker Compose**. [https://helpcenter.onlyoffice.com](https://helpcenter.onlyoffice.com/docs/installation/docs-community-docker-compose.aspx)
