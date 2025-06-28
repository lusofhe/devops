const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const TTSService = require('../services/tts-service');
const VocabularyModel = require('../database/models/vocabulary-model');

// Pfade konfigurieren
const VOCABULARY_DIR = path.join(__dirname, '../vocabulary');
const AUDIO_OUTPUT_DIR = path.join(__dirname, '../public/audio');

// Sicherstellen, dass der Audio-Ausgabeordner existiert
if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
  fs.mkdirSync(AUDIO_OUTPUT_DIR, { recursive: true });
}


// Vokabelmodell initialisieren
const vocabularyModel = new VocabularyModel();


// TTS-Service initialisieren
const ttsService = new TTSService(path.join(__dirname, '../../config/googleapikey.json'));

// Verfügbare Vokabellisten abrufen
router.get('/lists', async (req, res) => {
  try {
    // Zuerst aus der Datenbank laden
    const dbLists = await vocabularyModel.getAllLists();
    const dbListNames = dbLists.map(list => list.name);

    // Dann aus dem Dateisystem für Abwärtskompatibilität
    let fileLists = [];
    if (fs.existsSync(VOCABULARY_DIR)) {
      const files = fs.readdirSync(VOCABULARY_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          filename: file,
          displayName: file.replace('.json', ''),
          path: path.join(VOCABULARY_DIR, file)
        }));

      // Nur Dateien hinzufügen, die noch nicht in der Datenbank sind
      fileLists = files.filter(file =>
        !dbListNames.includes(file.displayName)
      );
    }

    // Kombinierte Liste erstellen
    const combinedLists = [
      ...dbLists.map(list => ({
        filename: `${list.name}.json`,
        displayName: list.name,
        fromDB: true
      })),
      ...fileLists
    ];

    res.json({ lists: combinedLists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Details einer bestimmten Vokabelliste abrufen
router.get('/list/:filename', async (req, res) => {
  try {
    const listName = req.params.filename.replace('.json', '');

    // Zuerst in der Datenbank suchen
    const dbList = await vocabularyModel.getListByName(listName);
    if (dbList) {
      return res.json({
        name: dbList.name,
        vocabulary: dbList.vocabulary
      });
    }

    // Falls nicht in der Datenbank, dann aus Datei laden
    const filePath = path.join(VOCABULARY_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const vocabulary = JSON.parse(fileContent).map(entry => ({
      DE: entry.DE || entry.deutsch || '',
      VN: entry.VN || entry.vietnamesisch || ''
    })).filter(entry => entry.DE && entry.VN);

    res.json({
      name: listName,
      vocabulary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TTS für ein einzelnes Wort generieren
router.post('/generate-word', async (req, res) => {
  try {
    const { text, language = 'de-DE', speed = 0.8, voice = 'FEMALE' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text erforderlich' });
    }

    // TTS-Service konfigurieren und Audio generieren
    const generatedFile = await ttsService
      .setLanguage(language)
      .setSpeed(speed)
      .setVoice(voice)
      .generateSpeech(text); // Kein spezifischer Ausgabedateiname, Hash-basierter wird verwendet

    res.json({
      success: true,
      audio: `/audio/${path.basename(generatedFile)}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TTS für eine bestimmte Vokabelliste generieren
router.post('/generate/:filename', async (req, res) => {
  try {
    const { speed = 0.8, voice = 'FEMALE' } = req.body;
    const filePath = path.join(VOCABULARY_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }


    const results = [];
    const fileBaseName = req.params.filename.replace('.json', '');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const vocabulary = JSON.parse(fileContent).map(entry => ({
      DE: entry.DE || entry.deutsch || '',
      VN: entry.VN || entry.vietnamesisch || ''
    })).filter(entry => entry.DE && entry.VN);

    // Für jedes Vokabelpaar Audio-Dateien generieren
    for (const [index, entry] of vocabulary.entries()) {
      // Für deutsche Wörter
      const germanFile = await ttsService
        .setLanguage('DE')
        .setSpeed(speed)
        .setVoice(voice)
        .generateSpeech(entry.DE);

      // Für vietnamesische Wörter
      const vietnameseFile = await ttsService
        .setLanguage('VN')
        .setSpeed(speed)
        .setVoice(voice)
        .generateSpeech(entry.VN);

      results.push({
        index,
        DE: {
          text: entry.DE,
          audio: `/audio/${path.basename(germanFile)}`
        },
        VN: {
          text: entry.VN,
          audio: `/audio/${path.basename(vietnameseFile)}`
        }
      });
    }


    res.json({
      success: true,
      name: fileBaseName,
      entries: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// routes/tts.js (Ergänzung)

// TrackParser-Modul importieren
const TrackParser = require('../utils/track-parser');

// Custom Track generieren
router.post('/generate-track', async (req, res) => {
  try {
    const { track, vocabulary, listName, voice = 'FEMALE' } = req.body;

    if (!track || !vocabulary || vocabulary.length === 0) {
      return res.status(400).json({ error: 'Track und Vokabeln erforderlich' });
    }

    // Track parsen
    const instructions = TrackParser.parseTrack(track);

    // Ergebnisse für jedes Vokabelpaar
    const results = [];

    // Für jedes Vokabelpaar die Anweisungen ausführen
    for (const [index, entry] of vocabulary.entries()) {
      const trackEntry = {
        index,
        sequence: []
      };

      // Für jede Anweisung im Track
      for (const instruction of instructions) {
        if (instruction.type === 'pause') {
          trackEntry.sequence.push({
            type: 'pause',
            duration: instruction.duration
          });
        } else if (instruction.type === 'speech') {
          const text = instruction.language === 'DE' ? entry.DE : entry.VN;

          // Audio generieren mit entsprechender Geschwindigkeit
          const audioFile = await ttsService
            .setLanguage(instruction.language)
            .setSpeed(instruction.speed)
            .setVoice(voice)
            .generateSpeech(text);

          trackEntry.sequence.push({
            type: 'speech',
            text: text,
            language: instruction.language,
            speed: instruction.speed,
            audio: `/audio/${path.basename(audioFile)}`
          });
        }
      }

      results.push(trackEntry);
    }

    res.json({
      success: true,
      name: listName,
      entries: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TTS für Freitext generieren
router.post('/generate-freitext', async (req, res) => {
  try {
    const { text, language = 'de-DE', speed = 0.8, voice = 'FEMALE' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text erforderlich' });
    }

    // TTS-Service konfigurieren und Audio generieren
    const generatedFile = await ttsService
      .setLanguage(language)
      .setSpeed(speed)
      .setVoice(voice)
      .generateSpeech(text);

    res.json({
      success: true,
      audio: `/audio/${path.basename(generatedFile)}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
