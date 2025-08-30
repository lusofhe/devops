# CI/CD Pipeline - Sprachenlern App

## Pipeline Übersicht

Diese Anwendung implementiert eine CI/CD-Pipeline mit GitHub Actions für Qualitätssicherung und Build, 
Sowie eine CD Pipeline für Deployment.

## Pipeline-Workflows

### 1. Continuous Integration (CI)
**Datei:** `.github/workflows/ci.yml`
- **Trigger:** Push auf main/develop, Pull Requests
- **Schritte:** Linting → Tests → Coverage → SonarQube
- **Quality Gate:** Alle Checks müssen bestehen

### 2. Continuous Delivery (CD-Delivery)
**Datei:** `.github/workflows/cd-delivery.yml`
- **Trigger:** Nach erfolgreichem CI-Workflow
- **Schritte:** Versionierung → Docker Build → Push → GitHub Release
- **Output:** Container-Images mit Tags
- **Semantic Versioning** Format: {package.version}-{datetime}-{git-hash} - Beispiel: 1.0.0-2025-01-15-14-30-45-abc1234

### 3. Continuous Deployment (CD-Deployment)
**Datei:** `.github/workflows/cd-deployment.yml`
- **Trigger:** Manuell (mit Bestätigung erforderlich)
- **Schritte:** Server-Deployment → Health Checks → Status-Report
- **Sicherheit:** SSH-basiert, umgebungsvariablen-konfiguriert

## Verwendung

### Entwicklung
```bash
npm install          # Dependencies
npm run dev         # Development Server
npm test            # Tests ausführen
npm run lint        # Code-Qualität prüfen
```

### Production Deployment
1. Code nach `main` pushen
2. CI-Pipeline läuft automatisch
3. Bei Erfolg: CD-Delivery erstellt Container
4. Manuell: CD-Deployment auf Server ausführen

## Konfiguration

### Erforderliche Secrets
- `DOCKER_USERNAME` / `DOCKER_PASSWORD`
- `SONAR_TOKEN` / `SONAR_HOST_URL`
- `HOST` / `USERNAME` / `SSH_KEY`
- `MONGO_USERNAME` / `MONGO_PASSWORD`
- `GOOGLE_TTS_API_KEY`

### Quality Standards
- ESLint: Keine Fehler
- Jest Tests: 100% bestanden
- Coverage: Mindestens 5% 
- SonarQube: Quality Gate bestanden

## Architektur

```
CI Pipeline → CD-Delivery → CD-Deployment
    ↓             ↓              ↓
  Tests      Docker Build   Server Deploy
  Lint       Versioning     Health Check
  SonarQube  Registry Push  Status Report
```

## Deployment-Ziele

- **Development:** Lokaler Docker-Container
- **Production:** Remote Server via SSH
- **Monitoring:** Health Checks und Logging
