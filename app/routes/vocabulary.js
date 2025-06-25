const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const VocabularyModel = require('../database/models/vocabulary-model');

// Pfad zum Vokabelordner
const VOCABULARY_DIR = path.join(__dirname, '../vocabulary');

// Sicherstellen, dass der Vokabelordner existiert
if (!fs.existsSync(VOCABULARY_DIR)) {
  fs.mkdirSync(VOCABULARY_DIR, { recursive: true });
}

// Vokabelmodell initialisieren
const vocabularyModel = new VocabularyModel();

/**
 * Route zum Speichern einer neuen Vokabelliste
 */
router.post('/save', async (req, res) => {
  try {
    const { name, vocabulary } = req.body;

    if (!name || !vocabulary || !Array.isArray(vocabulary)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Daten für die Vokabelliste'
      });
    }

    // Validieren, dass jedes Vokabel-Objekt DE und VN hat
    const isValidVocabulary = vocabulary.every(entry =>
      entry.DE && typeof entry.DE === 'string' &&
      entry.VN && typeof entry.VN === 'string'
    );

    if (!isValidVocabulary) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Vokabeln - jeder Eintrag muss DE und VN haben'
      });
    }

    // Nur in Datenbank speichern, nicht mehr als JSON-Datei
    try {
      await vocabularyModel.createList(name, vocabulary);
    } catch (error) {
      // Falls Liste bereits existiert, aktualisieren
      if (error.message.includes('existiert bereits')) {
        await vocabularyModel.updateList(name, vocabulary);
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      message: `Vokabelliste "${name}" wurde erfolgreich gespeichert`
    });

  } catch (error) {
    console.error('Fehler beim Speichern der Vokabelliste:', error);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Speichern der Vokabelliste'
    });
  }
});


/**
 * Route zum Abrufen aller Vokabellisten
 */
router.get('/lists', async (req, res) => {
  try {
    const lists = await vocabularyModel.getAllLists();
    res.json({
      success: true,
      lists: lists.map(list => ({
        id: list._id,
        name: list.name,
        count: list.vocabulary.length
      }))
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Vokabellisten:', error);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen der Vokabellisten'
    });
  }
});

/**
 * Route zum Abrufen einer einzelnen Vokabelliste
 */
router.get('/list/:name', async (req, res) => {
  try {
    const listName = req.params.name;
    const list = await vocabularyModel.getListByName(listName);

    if (!list) {
      return res.status(404).json({
        success: false,
        error: `Vokabelliste "${listName}" nicht gefunden`
      });
    }

    res.json({
      success: true,
      name: list.name,
      vocabulary: list.vocabulary
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Vokabelliste:', error);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen der Vokabelliste'
    });
  }
});

/**
 * Route zum Löschen einer Vokabelliste
 */
router.delete('/list/:name', async (req, res) => {
  try {
    const listName = req.params.name;

    // Aus Datenbank löschen
    const result = await vocabularyModel.deleteList(listName);

    // JSON-Datei löschen, falls vorhanden (für Abwärtskompatibilität)
    const filePath = path.join(VOCABULARY_DIR, `${listName}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (result === 0) {
      return res.status(404).json({
        success: false,
        error: `Vokabelliste "${listName}" nicht gefunden`
      });
    }

    res.json({
      success: true,
      message: `Vokabelliste "${listName}" wurde gelöscht`
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Vokabelliste:', error);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Löschen der Vokabelliste'
    });
  }
});

module.exports = router;
