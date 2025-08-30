const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Für Hash-Generierung

class TTSService {
  constructor(apiKeyPath) {
    // API-Key aus Datei laden
    this.loadApiKey(apiKeyPath);

    // Standard-Einstellungen
    this.language = 'de-DE';  // Deutsch als Standardsprache
    this.speakingRate = 1.0;  // Normale Geschwindigkeit
    this.voice = 'NEUTRAL';   // Neutrale Stimme

    // Audio-Ausgabeordner konfigurieren
    this.audioDir = path.join(__dirname, '../public/audio');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  // Sichere API-Key Laden mit Umgebungsvariablen
  loadApiKey() {
  // 1. Priorität: Umgebungsvariable
    if (process.env.GOOGLE_TTS_API_KEY) {
      this.apiKey = process.env.GOOGLE_TTS_API_KEY;
      console.log('🔑 Google TTS API Key aus Umgebungsvariable geladen');
      return;
    }

    // 2. Fallback für lokale Entwicklung: JSON-Datei
    if (process.env.NODE_ENV !== 'production') {
      try {
        const keyFilePath = path.join(__dirname, '../config/googleapikey.json');
        if (fs.existsSync(keyFilePath)) {
          const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
          const keyData = JSON.parse(keyFileContent);

          if (keyData.apiKey) {
            this.apiKey = keyData.apiKey;
            console.log('🔑 Google TTS API Key aus Datei geladen (Development-Modus)');
            return;
          }
        }
      } catch (error) {
        console.warn('⚠️ Konnte API-Key nicht aus Datei laden:', error.message);
      }
    }

    // 3. Fehler werfen wenn nichts gefunden
    const errorMsg = process.env.NODE_ENV === 'production'
      ? 'GOOGLE_TTS_API_KEY Umgebungsvariable ist in Production erforderlich'
      : 'Google TTS API Key nicht gefunden. Setzen Sie GOOGLE_TTS_API_KEY Umgebungsvariable '
      +'oder erstellen Sie config/googleapikey.json';

    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  // Sprache einstellen
  setLanguage(language) {
  // Liste der unterstützten Sprachen
    const supportedLanguages = {
      'DE': 'de-DE',
      'VN': 'vi-VN',
      // Für Abwärtskompatibilität
      'deutsch': 'de-DE',
      'vietnamesisch': 'vi-VN'
    // Weitere Sprachen können hier hinzugefügt werden
    };

    // Überprüfen, ob die angegebene Sprache unterstützt wird
    if (language in supportedLanguages) {
      this.language = supportedLanguages[language];
    } else if (Object.values(supportedLanguages).includes(language)) {
      this.language = language;
    } else {
      console.warn(`Warnung: Sprache "${language}" nicht erkannt, verwende Standard (${this.language})`);
    }

    return this;
  }


  // Sprechgeschwindigkeit einstellen (0.25 bis 4.0)
  setSpeed(speed) {
    // Geschwindigkeit auf gültigen Bereich beschränken
    if (speed < 0.25) {
      this.speakingRate = 0.25;
    } else if (speed > 4.0) {
      this.speakingRate = 4.0;
    } else {
      this.speakingRate = parseFloat(speed);
    }

    return this;
  }

  // Stimmentyp einstellen (MALE, FEMALE, NEUTRAL)
  setVoice(voiceType) {
    const validVoices = ['MALE', 'FEMALE', 'NEUTRAL'];
    const voiceUpper = voiceType.toUpperCase();

    if (validVoices.includes(voiceUpper)) {
      this.voice = voiceUpper;
    }

    return this;
  }

  // Erstellt einen Hash aus den Generierungsparametern
  generateParameterHash(text) {
    // Erstellt einen String mit allen relevanten Parametern
    const paramString = `${text}_${this.language}_${this.speakingRate}_${this.voice}`;

    // Generiert einen MD5-Hash daraus (kurz, aber ausreichend für unsere Zwecke)
    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  // Text zu Sprache konvertieren mit Caching
  async generateSpeech(text, outputFilename = null) {
    try {
      // Hash aus den Parametern erstellen
      const paramHash = this.generateParameterHash(text);

      // Dateiname basierend auf dem Hash erstellen
      const hashBasedFilename = path.join(this.audioDir, `tts_${paramHash}.mp3`);

      // Prüfen, ob die Datei bereits existiert (Cache-Hit)
      if (fs.existsSync(hashBasedFilename)) {
        console.log(`Cache-Hit für Text: "${text.substring(0, 20)}..." mit Geschwindigkeit ${this.speakingRate}`);

        // Wenn ein spezifischer Dateiname gewünscht wird, kopieren wir die Datei
        if (outputFilename && outputFilename !== hashBasedFilename) {
          fs.copyFileSync(hashBasedFilename, outputFilename);
          return outputFilename;
        }

        return hashBasedFilename;
      }

      // Cache-Miss: Neue Anfrage an die API senden
      console.log(`Cache-Miss für Text: "${text.substring(0, 20)}..." mit Geschwindigkeit ${this.speakingRate}`);

      // Anfrage-URL für die Text-to-Speech API
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

      // Anfrage-Body mit aktuellen Einstellungen
      const requestBody = {
        input: { text },
        voice: {
          languageCode: this.language,
          ssmlGender: this.voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: this.speakingRate
        }
      };

      // API-Anfrage senden
      const response = await axios.post(url, requestBody);

      // Die API gibt Base64-kodierte Audiodaten zurück
      const audioContent = response.data.audioContent;

      // Base64-kodierte Daten dekodieren und im Cache speichern
      fs.writeFileSync(hashBasedFilename, Buffer.from(audioContent, 'base64'));

      // Wenn ein spezifischer Dateiname gewünscht wird, kopieren wir die Datei
      if (outputFilename && outputFilename !== hashBasedFilename) {
        fs.copyFileSync(hashBasedFilename, outputFilename);
        return outputFilename;
      }

      return hashBasedFilename;
    } catch (error) {
      console.error('Fehler bei der Text-to-Speech-Anfrage:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

module.exports = TTSService;
