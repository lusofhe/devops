// routes/vocabulary.js
const express = require('express');
const VocabularyModel = require('../database/models/vocabulary-model');

const router = express.Router();

/**
 * POST /api/vocabulary/save
 * Speichert eine neue Vokabelliste
 */
router.post('/save', async (req, res) => {
  try {
    const { name, vocabulary } = req.body;

    // Validierung der Eingabedaten
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Daten: Name ist erforderlich'
      });
    }

    if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Daten: Vokabelliste darf nicht leer sein'
      });
    }

    // Validierung der Vokabeleinträge
    for (const entry of vocabulary) {
      if (!entry || typeof entry !== 'object' || !entry.DE || !entry.VN) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Daten: Jeder Vokabeleintrag muss DE und VN enthalten'
        });
      }
    }

    // Neue Vokabelliste erstellen
    const vocabularyModel = new VocabularyModel();
    const savedList = await vocabularyModel.createList(name.trim(), vocabulary);

    res.status(200).json({
      success: true,
      data: savedList,
      message: 'Vokabelliste erfolgreich gespeichert'
    });

  } catch (error) {
    console.error('Error saving vocabulary list:', error);

    // Spezifische Fehlerbehandlung für bereits existierende Listen
    if (error.message && error.message.includes('existiert bereits')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    // Allgemeine Datenbankfehler
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

/**
 * GET /api/vocabulary/lists
 * Gibt alle verfügbaren Vokabellisten zurück
 */
router.get('/lists', async (req, res) => {
  try {
    const vocabularyModel = new VocabularyModel();
    const lists = await vocabularyModel.getAllLists();

    res.json({
      success: true,
      lists: lists
    });

  } catch (error) {
    console.error('Error fetching vocabulary lists:', error);
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

/**
 * GET /api/vocabulary/list/:name
 * Gibt eine bestimmte Vokabelliste zurück
 */
router.get('/list/:name', async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name der Liste ist erforderlich'
      });
    }

    const vocabularyModel = new VocabularyModel();
    const list = await vocabularyModel.getListByName(name.trim());

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'Vokabelliste nicht gefunden'
      });
    }

    res.json({
      success: true,
      name: list.name,
      vocabulary: list.vocabulary
    });

  } catch (error) {
    console.error('Error fetching vocabulary list:', error);
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

/**
 * PUT /api/vocabulary/update/:name
 * Aktualisiert eine vorhandene Vokabelliste
 */
router.put('/update/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { vocabulary } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name der Liste ist erforderlich'
      });
    }

    if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Daten: Vokabelliste darf nicht leer sein'
      });
    }

    // Validierung der Vokabeleinträge
    for (const entry of vocabulary) {
      if (!entry || typeof entry !== 'object' || !entry.DE || !entry.VN) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Daten: Jeder Vokabeleintrag muss DE und VN enthalten'
        });
      }
    }

    const vocabularyModel = new VocabularyModel();
    const updatedCount = await vocabularyModel.updateList(name.trim(), vocabulary);

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vokabelliste nicht gefunden'
      });
    }

    res.json({
      success: true,
      message: 'Vokabelliste erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Error updating vocabulary list:', error);
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

/**
 * DELETE /api/vocabulary/list/:name
 * Löscht eine Vokabelliste
 */
router.delete('/list/:name', async (req, res) => {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Name der Liste ist erforderlich'
      });
    }

    const vocabularyModel = new VocabularyModel();
    const deletedCount = await vocabularyModel.deleteList(name.trim());

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vokabelliste nicht gefunden'
      });
    }

    res.json({
      success: true,
      message: 'Liste wurde gelöscht'
    });

  } catch (error) {
    console.error('Error deleting vocabulary list:', error);
    res.status(500).json({
      success: false,
      error: 'Database error: ' + error.message
    });
  }
});

module.exports = router;