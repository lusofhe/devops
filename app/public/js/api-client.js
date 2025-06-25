/**
 * API-Client für die Kommunikation mit dem Backend
 */
class ApiClient {
    /**
     * Ruft alle verfügbaren Vokabellisten vom Server ab
     */
    async fetchVocabularyLists() {
        try {
            const response = await fetch('/api/tts/lists');
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Abrufen der Vokabellisten:', error);
            throw error;
        }
    }

    /**
     * Lädt eine bestimmte Vokabelliste
     * @param {string} filename - Dateiname der Vokabelliste
     */
    async loadVocabularyList(filename) {
        try {
            const response = await fetch(`/api/tts/list/${filename}`);
            return await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Vokabelliste:', error);
            throw error;
        }
    }

    /**
     * Generiert Audio für ein einzelnes Wort
     * @param {string} text - Text, der in Sprache umgewandelt werden soll
     * @param {string} language - Sprachcode (z.B. 'de-DE')
     * @param {number} speed - Sprechgeschwindigkeit (0.25 - 4.0)
     * @param {string} voice - Stimmentyp (FEMALE, MALE, NEUTRAL)
     */
    async generateWordAudio(text, language, speed, voice) {
        try {
            const response = await fetch('/api/tts/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    language,
                    speed,
                    voice
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Fehler bei der Audio-Generierung');
            }

            return data.audio;
        } catch (error) {
            console.error('Fehler beim Generieren des Audio:', error);
            throw error;
        }
    }

    /**
     * Generiert Audio für alle Wörter einer Vokabelliste
     * @param {string} listName - Name der Vokabelliste
     * @param {number} speed - Sprechgeschwindigkeit
     * @param {string} voice - Stimmentyp
     */
    async generateAllAudio(listName, speed, voice) {
        try {
            const response = await fetch(`/api/tts/generate/${listName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    speed,
                    voice
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Fehler bei der Audio-Generierung');
            }

            return data;
        } catch (error) {
            console.error('Fehler bei der Generierung aller Audio-Dateien:', error);
            throw error;
        }
    }


    // public/js/api-client.js (Ergänzung)
/**
 * Generiert Audio für einen benutzerdefinierten Track
 * @param {string} track - Der Track-String
 * @param {Array} vocabulary - Die Vokabeln
 * @param {string} listName - Name der Vokabelliste
 * @param {string} voice - Stimmentyp (FEMALE, MALE, NEUTRAL)
 */
async generateTrackAudio(track, vocabulary, listName, voice) {
  try {
    const response = await fetch('/api/tts/generate-track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        track,
        vocabulary,
        listName,
        voice
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Fehler bei der Track-Generierung');
    }

    return data;
  } catch (error) {
    console.error('Fehler bei der Generierung des Tracks:', error);
    throw error;
  }
}

}

// Export als globale Variable
window.apiClient = new ApiClient();
