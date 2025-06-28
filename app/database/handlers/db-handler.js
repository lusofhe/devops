// database/handlers/db-handler.js
//const path = require('path');
//const fs = require('fs');
//const { ObjectId } = require('mongodb');
const dbConnection = require('../db-connection');

/**
 * Abstraktionsschicht für den Datenbankzugriff
 */
class DatabaseHandler {
  /**
   * Erzeugt eine neue Instanz des Datenbank-Handlers
   * @param {Object} options Konfigurationsoptionen
   * @param {string} options.collection Name der Collection/Tabelle
   */
  constructor(options = {}) {
    this.collectionName = options.collection || 'lists';
    this.db = null;
    this.collection = null;
  }

  /**
   * Initialisiert die Datenbankverbindung
   */
  async init() {
    try {
      this.db = await dbConnection.getDb();
      this.collection = this.db.collection(this.collectionName);
      console.log(`MongoDB Collection initialisiert: ${this.collectionName}`);
      return this.collection;
    } catch (error) {
      console.error(`Fehler bei der Collection-Initialisierung: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stellt sicher, dass die Collection initialisiert ist
   */
  async ensureCollection() {
    if (!this.collection) {
      await this.init();
    }
    return this.collection;
  }

  /**
   * Fügt ein neues Dokument in die Datenbank ein
   * @param {Object} document Das einzufügende Dokument
   * @returns {Promise<Object>} Das eingefügte Dokument mit _id
   */
  async insert(document) {
    try {
      await this.ensureCollection();

      const result = await this.collection.insertOne(document);
      return { ...document, _id: result.insertedId };
    } catch (error) {
      console.error('Fehler beim Einfügen des Dokuments:', error);
      throw error;
    }
  }

  /**
   * Sucht Dokumente, die dem Query entsprechen
   * @param {Object} query Suchabfrage
   * @returns {Promise<Array>} Gefundene Dokumente
   */
  async find(query = {}) {
    try {
      await this.ensureCollection();

      return await this.collection.find(query).toArray();
    } catch (error) {
      console.error('Fehler beim Suchen von Dokumenten:', error);
      throw error;
    }
  }

  /**
   * Findet ein einzelnes Dokument
   * @param {Object} query Suchabfrage
   * @returns {Promise<Object>} Gefundenes Dokument oder null
   */
  async findOne(query = {}) {
    try {
      await this.ensureCollection();

      return await this.collection.findOne(query);
    } catch (error) {
      console.error('Fehler beim Suchen des Dokuments:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert Dokumente, die dem Query entsprechen
   * @param {Object} query Suchabfrage
   * @param {Object} update Update-Operation
   * @param {Object} options Update-Optionen
   * @returns {Promise<Number>} Anzahl der aktualisierten Dokumente
   */
  async update(query, update, options = {}) {
    try {
      await this.ensureCollection();

      const result = await this.collection.updateMany(query, update, options);
      return result.modifiedCount;
    } catch (error) {
      console.error('Fehler beim Aktualisieren von Dokumenten:', error);
      throw error;
    }
  }

  /**
   * Entfernt Dokumente, die dem Query entsprechen
   * @param {Object} query Suchabfrage
   * @returns {Promise<Number>} Anzahl der gelöschten Dokumente
   */
  async remove(query) {
    try {
      await this.ensureCollection();

      const result = await this.collection.deleteMany(query);
      return result.deletedCount;
    } catch (error) {
      console.error('Fehler beim Löschen von Dokumenten:', error);
      throw error;
    }
  }

  /**
   * Speichert Vokabellisten in der Datenbank
   * @param {string} name Name der Vokabelliste
   * @param {Array} vocabulary Array mit Vokabelpaaren
   * @returns {Promise<Object>} Das gespeicherte Listendokument
   */
  async saveVocabularyList(name, vocabulary) {
    const listDocument = {
      name: name,
      vocabulary: vocabulary,
      createdAt: new Date()
    };

    return await this.insert(listDocument);
  }

  /**
   * Speichert Referenzen zu Bildern oder anderen Binärdaten
   * @param {Object} metadata Metadaten zum Bild/zur Binärdatei
   * @param {string} filePath Pfad zur Datei
   * @returns {Promise<Object>} Das gespeicherte Dokumentenobjekt
   */
  async saveImageReference(metadata, filePath) {
    const imageDoc = {
      ...metadata,
      filePath: filePath,
      uploadDate: new Date()
    };

    return await this.insert(imageDoc);
  }
}

module.exports = DatabaseHandler;
