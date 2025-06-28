// scripts/init-database.js
const dbConnection = require('../database/db-connection');
const VocabularyModel = require('../database/models/vocabulary-model');
const vocabularies = require('../seeds/example-vocabularies');

/**
 * Initialisiert die Datenbank mit Beispiel-Vokabellisten
 */
async function initDatabase() {
  console.log('🚀 Starte Datenbank-Initialisierung...\n');

  try {
    // Datenbankverbindung herstellen
    console.log('📡 Verbinde mit MongoDB...');
    await dbConnection.connect();
    console.log('✅ MongoDB-Verbindung hergestellt\n');

    // VocabularyModel initialisieren
    const vocabModel = new VocabularyModel();
    await vocabModel.init();

    let createdCount = 0;
    let existingCount = 0;
    let totalVocabulary = 0;

    console.log('📚 Erstelle Vokabellisten...\n');

    // Durch alle Vokabellisten iterieren
    for (const [listName, vocabulary] of Object.entries(vocabularies)) {
      try {
        // Versuche Liste zu erstellen
        await vocabModel.createList(listName, vocabulary);
        createdCount++;
        totalVocabulary += vocabulary.length;
        console.log(`✅ "${listName}" erstellt (${vocabulary.length} Vokabeln)`);

      } catch (error) {
        if (error.message.includes('existiert bereits')) {
          existingCount++;
          console.log(`⏭️  "${listName}" existiert bereits`);
        } else {
          console.error(`❌ Fehler bei "${listName}":`, error.message);
          throw error;
        }
      }
    }

    // Zusammenfassung
    console.log('\n' + '='.repeat(50));
    console.log('📊 ZUSAMMENFASSUNG');
    console.log('='.repeat(50));
    console.log(`✅ Neue Listen erstellt: ${createdCount}`);
    console.log(`⏭️  Bereits vorhanden: ${existingCount}`);
    console.log(`📝 Gesamte Vokabellisten: ${createdCount + existingCount}`);
    console.log(`🔤 Neue Vokabeln hinzugefügt: ${totalVocabulary}`);
    console.log('='.repeat(50));

    if (createdCount > 0) {
      console.log('\n🎉 Datenbank erfolgreich initialisiert!');
      console.log('💡 Sie können jetzt die Anwendung starten und die Vokabellisten verwenden.');
    } else {
      console.log('\n📋 Alle Listen waren bereits vorhanden.');
      console.log('💡 Die Datenbank ist bereit für die Nutzung.');
    }

    // Verfügbare Listen anzeigen
    console.log('\n📚 Verfügbare Vokabellisten:');
    const allLists = await vocabModel.getAllLists();
    allLists.forEach(list => {
      console.log(`   • ${list.name} (${list.vocabulary.length} Vokabeln)`);
    });

  } catch (error) {
    console.error('\n❌ FEHLER bei der Datenbank-Initialisierung:');
    console.error(error.message);
    console.error('\n🔍 Mögliche Lösungsansätze:');
    console.error('   1. Überprüfen Sie die MongoDB-Verbindung');
    console.error('   2. Stellen Sie sicher, dass MongoDB läuft');
    console.error('   3. Überprüfen Sie die Konfiguration in config/database.js');
    process.exit(1);
  } finally {
    // Verbindung schließen
    await dbConnection.close();
    console.log('\n🔌 MongoDB-Verbindung geschlossen');
  }
}

/**
 * Überprüft ob die Datenbank bereits Daten enthält
 */
async function checkDatabaseStatus() {
  try {
    await dbConnection.connect();
    const vocabModel = new VocabularyModel();
    await vocabModel.init();

    const existingLists = await vocabModel.getAllLists();
    return existingLists.length;
  } catch {
    return 0;
  } finally {
    await dbConnection.close();
  }
}

/**
 * Interaktiver Modus für bereits befüllte Datenbank
 */
async function interactiveMode() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n❓ Die Datenbank enthält bereits Vokabellisten.');
    readline.question('   Möchten Sie trotzdem fortfahren? (j/N): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'j' || answer.toLowerCase() === 'ja');
    });
  });
}

// Hauptfunktion für den direkten Aufruf
async function main() {
  console.log('🌱 DATENBANK-INITIALISIERUNG');
  console.log('=' .repeat(50));

  // Überprüfe aktuellen Status
  const existingListsCount = await checkDatabaseStatus();

  if (existingListsCount > 0) {
    console.log(`\n📋 Gefunden: ${existingListsCount} bestehende Vokabellisten`);

    // Überprüfe ob wir im interaktiven Modus sind
    if (process.argv.includes('--force')) {
      console.log('🔧 --force Flag erkannt, überspringt Bestätigung');
    } else {
      const shouldContinue = await interactiveMode();
      if (!shouldContinue) {
        console.log('\n⏹️  Initialisierung abgebrochen');
        console.log('💡 Verwenden Sie "npm run init -- --force" um zu erzwingen');
        process.exit(0);
      }
    }
  }

  await initDatabase();
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unerwarteter Fehler:', error);
    process.exit(1);
  });
}

module.exports = {
  initDatabase,
  checkDatabaseStatus
};
