/**
 * Sichere Konfigurationsdatei für Datenbankverbindungen
 * Verwendet ausschließlich Umgebungsvariablen
 */

const environment = process.env.NODE_ENV || 'development';

// Validierung erforderlicher Umgebungsvariablen für Production
function validateEnvironment() {
  const requiredVars = ['MONGODB_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0 && environment === 'production') {
    console.error(`❌ Fehlende Umgebungsvariablen: ${missingVars.join(', ')}`);
    console.error('💡 Setzen Sie diese in Ihrer .env Datei oder als Environment Variables');
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Umgebungsvalidierung ausführen
validateEnvironment();

const config = {
  mongodb: {
    // MongoDB URL aus Umgebungsvariable
    url: process.env.MONGODB_URL || (
      environment === 'development'
        ? 'mongodb://localhost:27017'
        : null
    ),

    // Authentifizierung aus Umgebungsvariablen
    auth: {
      username: process.env.MONGODB_USER || (environment === 'development' ? 'admin' : null),
      password: process.env.MONGODB_PASSWORD || (environment === 'development' ? 'password' : null),
      authSource: process.env.MONGODB_AUTH_SOURCE || 'admin'
    },

    // Datenbankname
    dbName: process.env.MONGODB_DB_NAME || 'vocabulary',

    // Collections (statisch)
    collections: {
      lists: 'lists',
      users: 'users',
      logs: 'logs'
    },

    // Verbindungsoptionen
    options: {
      useUnifiedTopology: true,
      connectTimeoutMS: environment === 'production' ? 15000 : 5000,
      socketTimeoutMS: environment === 'production' ? 60000 : 30000,
      serverSelectionTimeoutMS: environment === 'production' ? 15000 : 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true
    },

    // Sichere Connection-URL Erstellung
    getConnectionUrl: function() {
      if (process.env.MONGODB_URL) {
        console.log('📡 Using MongoDB URL from environment variable');
        // Sicherheitslog ohne Passwort
        const safeUrl = process.env.MONGODB_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log(`🔗 Connecting to: ${safeUrl}`);
        return process.env.MONGODB_URL;
      }

      // Development Fallback
      if (environment === 'development') {
        const { username, password, authSource } = this.auth;
        if (username && password) {
          const devUrl = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@localhost:27017/${this.dbName}?authSource=${authSource}`;
          console.log('🔧 Using development MongoDB configuration');
          return devUrl;
        }

        const simpleUrl = `mongodb://localhost:27017/${this.dbName}`;
        console.log('🔧 Using simple MongoDB configuration (no auth)');
        return simpleUrl;
      }

      throw new Error('❌ No MongoDB connection URL available. Set MONGODB_URL environment variable.');
    }
  }
};

// Debug-Informationen nur in Development
if (environment === 'development') {
  console.log(`🔧 Database configuration loaded for environment: ${environment}`);
  console.log(`📊 Database name: ${config.mongodb.dbName}`);
  console.log(`🔐 Auth source: ${config.mongodb.auth.authSource}`);
}

module.exports = config;
