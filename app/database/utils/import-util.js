// Anfang von import-util.js
const fs = require('fs');
const path = require('path');
const VocabularyModel = require('../models/vocabulary-model');
const dbConfig = require('../../../config/database');
const { MongoClient } = require('mongodb');

/**
 * Hilfsklasse zum Importieren bestehender JSON-Vokabellisten
 */
class ImportUtil {
  constructor() {
    this.vocabularyModel = new VocabularyModel();
  }


  /**
   * Importiert eine einzelne JSON-Datei in die Datenbank
   * @param {string} filePath Vollständiger Pfad zur JSON-Datei
   * @returns {Promise<Object>} Ergebnis des Imports
   */
  async importFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const vocabulary = JSON.parse(fileContent);

      if (!Array.isArray(vocabulary)) {
        throw new Error('Die JSON-Datei enthält kein gültiges Array');
      }

      // Prüfen und normalisieren der Vokabeleinträge
      const normalizedVocabulary = vocabulary.map(entry => {
        const normalized = {};

        if (entry.DE !== undefined) {
          normalized.DE = entry.DE;
        } else if (entry.deutsch !== undefined) {
          normalized.DE = entry.deutsch;
        } else {
          throw new Error('Vokabeleinträge müssen ein "DE" oder "deutsch" Feld haben');
        }

        if (entry.VN !== undefined) {
          normalized.VN = entry.VN;
        } else if (entry.vietnamesisch !== undefined) {
          normalized.VN = entry.vietnamesisch;
        } else {
          throw new Error('Vokabeleinträge müssen ein "VN" oder "vietnamesisch" Feld haben');
        }

        return normalized;
      });

      // Dateiname ohne Erweiterung als Listenname verwenden
      const fileName = path.basename(filePath);
      const listName = fileName.replace('.json', '');

      // Importieren in die Datenbank
      try {
        const result = await this.vocabularyModel.createList(listName, normalizedVocabulary);
        return {
          success: true,
          message: `Liste "${listName}" mit ${normalizedVocabulary.length} Vokabeln importiert`,
          listName,
          count: normalizedVocabulary.length,
          id: result._id
        };
      } catch (err) {
        if (err.message.includes('existiert bereits')) {
          // Liste aktualisieren, wenn sie bereits existiert
          await this.vocabularyModel.updateList(listName, normalizedVocabulary);
          return {
            success: true,
            message: `Liste "${listName}" mit ${normalizedVocabulary.length} Vokabeln aktualisiert`,
            listName,
            count: normalizedVocabulary.length,
            updated: true
          };
        } else {
          throw err;
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Fehler beim Importieren von "${path.basename(filePath)}": ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Importiert alle JSON-Dateien aus einem Verzeichnis
   * @param {string} directoryPath Pfad zum Verzeichnis
   * @returns {Promise<Array>} Ergebnisse aller Import-Operationen
   */
  async importDirectory(directoryPath) {
    try {
      // Prüfen, ob das Verzeichnis existiert
      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Verzeichnis ${directoryPath} nicht gefunden`);
      }

      // Alle JSON-Dateien im Verzeichnis auflisten
      const files = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(directoryPath, file));

      if (files.length === 0) {
        return [{
          success: false,
          message: `Keine JSON-Dateien im Verzeichnis ${directoryPath} gefunden`
        }];
      }

      // Alle Dateien importieren
      const results = [];
      for (const file of files) {
        const result = await this.importFile(file);
        results.push({
          file: path.basename(file),
          ...result
        });
      }

      return results;
    } catch (error) {
      return [{
        success: false,
        message: `Fehler beim Importieren des Verzeichnisses: ${error.message}`,
        error: error.message
      }];
    }
  }
}

module.exports = ImportUtil;
