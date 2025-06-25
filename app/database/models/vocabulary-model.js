// database/models/vocabulary-model.js
const DatabaseHandler = require('../handlers/db-handler');
const dbConnection = require('../db-connection');
const dbConfig = require('../../config/database');

/**
 * Modell für Vokabellisten
 */
class VocabularyModel {
  constructor() {
    // Datenbankhandler mit Collection aus der Konfiguration initialisieren
    this.dbHandler = new DatabaseHandler({
      collection: dbConfig.mongodb.collections.lists
    });
  }

  /**
   * Initialisiere das Model
   * @returns {Promise<VocabularyModel>} Die initialisierte Instanz
   */
  async init() {
    // Stelle sicher, dass die Datenbankverbindung hergestellt ist
    await dbConnection.connect();

    // Handler initialisieren
    await this.dbHandler.init();
    return this;
  }

  /**
   * Speichert eine neue Vokabelliste
   * @param {string} name Name der Vokabelliste
   * @param {Array} vocabulary Array mit Vokabelpaaren {DE, VN}
   * @returns {Promise<Object>} Das gespeicherte Listendokument
   */
  async createList(name, vocabulary) {
    await this.init();

    // Überprüfen, ob bereits eine Liste mit diesem Namen existiert
    const existingList = await this.dbHandler.findOne({ name });
    if (existingList) {
      throw new Error(`Eine Liste mit dem Namen '${name}' existiert bereits`);
    }

    return await this.dbHandler.saveVocabularyList(name, vocabulary);
  }

  /**
   * Gibt alle verfügbaren Vokabellisten zurück
   * @returns {Promise<Array>} Array mit allen Vokabellisten
   */
  async getAllLists() {
    await this.init();
    return await this.dbHandler.find({});
  }

  /**
   * Gibt eine bestimmte Vokabelliste nach Namen zurück
   * @param {string} name Name der Vokabelliste
   * @returns {Promise<Object>} Die gefundene Vokabelliste oder null
   */
  async getListByName(name) {
    await this.init();
    return await this.dbHandler.findOne({ name });
  }

  /**
   * Aktualisiert eine vorhandene Vokabelliste
   * @param {string} name Name der Liste
   * @param {Array} vocabulary Neue Vokabeln
   * @returns {Promise<Number>} Anzahl der aktualisierten Dokumente
   */
  async updateList(name, vocabulary) {
    await this.init();
    return await this.dbHandler.update(
      { name },
      { $set: { vocabulary, updatedAt: new Date() } }
    );
  }

  /**
   * Löscht eine Vokabelliste
   * @param {string} name Name der zu löschenden Liste
   * @returns {Promise<Number>} Anzahl der gelöschten Dokumente
   */
  async deleteList(name) {
    await this.init();
    return await this.dbHandler.remove({ name });
  }
}

module.exports = VocabularyModel;
