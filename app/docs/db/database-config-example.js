/**
 * Zentrale Konfigurationsdatei für Datenbankverbindungen
 * Diese Datei enthält alle Datenbankeinstellungen für verschiedene Umgebungen
 */

// Umgebungsvariablen mit Vorrang vor Standardwerten verwenden
const environment = process.env.NODE_ENV || 'development';

// Basiskonfiguration
const config = {
  // MongoDB Konfiguration
  mongodb: {
    // Basis-URL aus Umgebungsvariablen oder Standardwert
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017',

    // Authentifizierung
    auth: {
      username: process.env.MONGODB_USER || 'admin',
      password: process.env.MONGODB_PASSWORD || 'password',
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin'
    },

    // Datenbankname
    dbName: process.env.MONGODB_DB_NAME || 'vocabulary',

    // Standardsammlungen
    collections: {
      lists: 'lists',
      users: 'users',
      logs: 'logs'
    },

    // Verbindungsoptionen
    options: {
      useUnifiedTopology: true,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  }
};

// Umgebungsspezifische Konfigurationen
const environments = {
  development: {
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017'
    }
  },

  test: {
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
      dbName: 'vocabulary_test'
    }
  },

  production: {
    mongodb: {
      // In Produktion müssen Anmeldeinformationen über Umgebungsvariablen gesetzt werden
      url: process.env.MONGODB_URL,
      options: {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 10000
      }
    }
  }
};

// Konfigurationen zusammenführen
const environmentConfig = environments[environment] || {};
const finalConfig = {
  mongodb: {
    ...config.mongodb,
    ...environmentConfig.mongodb,
    // URL mit Authentifizierung erstellen, falls keine Umgebungsvariable gesetzt ist
    url: environmentConfig.mongodb?.url || config.mongodb.url,
    // Vollständige Connection-URL erstellen, wenn Authentifizierungsdaten vorhanden sind
    getConnectionUrl: function() {
      if (process.env.MONGODB_URL) {
        return process.env.MONGODB_URL;
      }

      const { username, password, authSource } = this.auth;
      if (username && password) {
        // URL mit Authentifizierung
        return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${this.url.replace('mongodb://', '')}/${this.dbName}?authSource=${authSource}`;
      }

      // URL ohne Authentifizierung
      return `${this.url}/${this.dbName}`;
    }
  }
};

module.exports = finalConfig;
