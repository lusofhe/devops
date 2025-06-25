// database/db-connection.js
const { MongoClient } = require('mongodb');
const dbConfig = require('../config/database');

class DatabaseConnection {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (this.db) return this.db;

    try {
      // Use the getConnectionUrl method which properly includes authentication
      const connectionUrl = dbConfig.mongodb.getConnectionUrl();
      console.log('Connecting to MongoDB with URL: ' + connectionUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

      this.client = new MongoClient(connectionUrl);
      await this.client.connect();
      console.log('Verbindung zur MongoDB-Datenbank hergestellt');
      this.db = this.client.db(dbConfig.mongodb.dbName);
      return this.db;
    } catch (error) {
      console.error('Fehler beim Verbinden zur Datenbank:', error);
      throw error;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first');
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('MongoDB-Verbindung geschlossen');
    }
  }
}

// Singleton pattern
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
