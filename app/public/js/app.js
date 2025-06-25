/**
 * Hauptklasse der Anwendung
 */
class VocabTrainerApp {
    constructor() {
        this.currentList = null;
        this.vocabularyData = null;
        this.cardTrainer = null;

        // Dependency Injection
        this.apiClient = window.apiClient;
        this.uiManager = window.uiManager;
        this.audioPlayer = window.audioPlayerManager;

        // DOM-Elemente für Einstellungen
        this.voiceSelect = document.getElementById('voice-select');
        this.speedInput = document.getElementById('speed-input');

        // Track-Editor Elemente
        this.trackEditor = document.getElementById('track-editor');
        this.trackInput = document.getElementById('track-input');
        this.generateTrackButton = document.getElementById('generate-track-button');
        this.playTrackButton = document.getElementById('play-track-button');
        this.showTrackEditorButton = document.getElementById('show-track-editor-button');
        this.closeTrackEditorButton = document.getElementById('close-track-editor-button');

        // Event-Listener einrichten
        this.setupEventListeners();

        // Vokabellisten beim Laden der Seite abrufen
        this.init();
    }

    /**
     * Initialisiert die Anwendung
     */
    async init() {
        try {
            await this.fetchVocabularyLists();
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
        }
    }

    /**
     * Richtet Event-Listener ein
     */
    setupEventListeners() {
        // Button zum Generieren aller Vokabeln
        document.getElementById('generate-all-button').addEventListener('click',
            () => this.generateAllAudio());

        // Button zum Abspielen aller Vokabeln
        document.getElementById('play-all-button').addEventListener('click',
            () => this.togglePlayback());

        // Track-Editor Event-Listener
        this.showTrackEditorButton.addEventListener('click',
            () => this.toggleTrackEditor(true));
        this.closeTrackEditorButton.addEventListener('click',
            () => this.toggleTrackEditor(false));
        this.generateTrackButton.addEventListener('click',
            () => this.generateTrack());
        this.playTrackButton.addEventListener('click',
            () => this.toggleTrackPlayback());
    }

    /**
     * Ruft alle Vokabellisten ab und zeigt sie an
     */
    async fetchVocabularyLists() {
        try {
            const data = await this.apiClient.fetchVocabularyLists();

            if (data.lists && data.lists.length > 0) {
                this.uiManager.displayVocabularyLists(data.lists,
                    (filename) => this.loadVocabularyList(filename));
            } else {
                this.uiManager.listsContainer.innerHTML = '<p>Keine Vokabellisten gefunden.</p>';
            }
        } catch (error) {
            this.uiManager.displayError(
                `Fehler beim Laden der Listen: ${error.message}`,
                this.uiManager.listsContainer
            );
        }
    }

    /**
     * Lädt eine bestimmte Vokabelliste
     * @param {string} filename - Dateiname der Vokabelliste
     */
    async loadVocabularyList(filename) {
        // UI-Status aktualisieren
        this.uiManager.setActiveList(filename);
        this.uiManager.showVocabLoading();

        try {
            const data = await this.apiClient.loadVocabularyList(filename);

            // Daten speichern
            this.currentList = filename;
            this.vocabularyData = data.vocabulary;
            this.audioPlayer.setVocabulary(data.vocabulary);

            // UI aktualisieren
            this.uiManager.updateVocabHeader(`Vokabelliste: ${data.name}`);
            this.uiManager.showControlPanel(true);
            this.uiManager.displayVocabulary(data.vocabulary,
                (text, language, index) => this.playWord(text, language, index));
            this.uiManager.setPlayButtonState(false, false);

        } catch (error) {
            this.uiManager.updateVocabHeader('Fehler beim Laden');
            this.uiManager.displayError(error.message, this.uiManager.vocabContainer);
        }
    }

    /**
     * Generiert Audio für alle Vokabeln
     */
    async generateAllAudio() {
        if (!this.currentList) return;

        try {
            const speed = parseFloat(this.speedInput.value);
            const voice = this.voiceSelect.value;

            this.uiManager.setGenerateButtonState(true);

            const data = await this.apiClient.generateAllAudio(
                this.currentList,
                speed,
                voice
            );

            // Audio-URLs mit aktuellen Parametern speichern
            this.audioPlayer.addGeneratedAudio(data.entries, speed, voice);

            // UI aktualisieren
            this.uiManager.setGenerateButtonState(false);
            this.uiManager.setPlayButtonState(true, false);

            alert('Audio für alle Vokabeln wurde erfolgreich generiert!');

        } catch (error) {
            this.uiManager.setGenerateButtonState(false);
            alert(`Fehler: ${error.message}`);
        }
    }

    /**
     * Spielt ein einzelnes Wort ab
     * @param {string} text - Abzuspielender Text
     * @param {string} language - Sprachcode ('deutsch' oder 'vietnamesisch')
     * @param {number} index - Index des Wortes in der Liste (wird nicht verwendet)
     */
async playWord(text, language, index) {
  try {
    // Aktuelle Parameter holen
    const speed = parseFloat(this.speedInput.value);
    const voice = this.voiceSelect.value;

    // Audio mit diesen Parametern abspielen oder generieren
    await this.audioPlayer.playWord(
      text,
      language,
      speed,
      voice,
      // Callback zur Generierung neuer Audio-Dateien
      async (textToGenerate, langCode, currentSpeed, currentVoice) => {
        // Sprach-Code für API konvertieren
        const apiLangCode = langCode === 'DE' ? 'de-DE' : 'vi-VN';

        // API-Anfrage zum Generieren des Audios
        return await this.apiClient.generateWordAudio(
          textToGenerate,
          apiLangCode,
          currentSpeed,
          currentVoice
        );
      }
    );
  } catch (error) {
    console.error('Fehler beim Abspielen des Wortes:', error);
    alert(`Fehler: ${error.message}`);
  }
}


    /**
     * Wechselt zwischen Abspielen und Stoppen aller Vokabeln
     */
    togglePlayback() {
        if (this.audioPlayer.getPlaybackStatus()) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    /**
     * Startet das Abspielen aller Vokabeln
     */
    startPlayback() {
        if (!this.vocabularyData || this.vocabularyData.length === 0) return;

        // Aktuelle Einstellungen für die Wiedergabe verwenden
        const speed = parseFloat(this.speedInput.value);
        const voice = this.voiceSelect.value;

        this.uiManager.setPlayButtonState(true, true);
        this.audioPlayer.startPlayback(
            (index) => this.uiManager.highlightVocabRow(index),
            () => this.uiManager.setPlayButtonState(true, false),
            speed,
            voice
        );
    }

    /**
     * Stoppt das Abspielen aller Vokabeln
     */
    stopPlayback() {
        this.audioPlayer.stopPlayback();
        this.uiManager.setPlayButtonState(true, false);
    }

    /**
     * Zeigt oder versteckt den Track-Editor
     * @param {boolean} show - Track-Editor anzeigen (true) oder ausblenden (false)
     */
    toggleTrackEditor(show) {
        this.trackEditor.style.display = show ? 'block' : 'none';
    }

    /**
     * Generiert einen benutzerdefinierten Track
     */
    async generateTrack() {
        if (!this.currentList || !this.vocabularyData) return;

        const trackString = this.trackInput.value.trim();
        if (!trackString) {
            alert('Bitte geben Sie einen Track ein.');
            return;
        }

        try {
            this.generateTrackButton.disabled = true;
            this.generateTrackButton.textContent = 'Generiere Track...';

            const voice = this.voiceSelect.value;

            const data = await this.apiClient.generateTrackAudio(
                trackString,
                this.vocabularyData,
                this.currentList.replace('.json', ''),
                voice
            );

            // Track im Audio-Player speichern
            this.audioPlayer.setTrack(data.entries);

            // UI aktualisieren
            this.generateTrackButton.disabled = false;
            this.generateTrackButton.textContent = 'Track generieren';
            this.playTrackButton.disabled = false;

            alert('Track wurde erfolgreich generiert!');

        } catch (error) {
            this.generateTrackButton.disabled = false;
            this.generateTrackButton.textContent = 'Track generieren';
            alert(`Fehler: ${error.message}`);
        }
    }

    /**
     * Wechselt zwischen Abspielen und Stoppen des Tracks
     */
    toggleTrackPlayback() {
        if (this.audioPlayer.getTrackPlaybackStatus()) {
            this.stopTrackPlayback();
        } else {
            this.startTrackPlayback();
        }
    }

    /**
     * Startet das Abspielen des Tracks
     */
    startTrackPlayback() {
        this.playTrackButton.textContent = 'Stopp';
        this.audioPlayer.startTrackPlayback(
            (index) => this.uiManager.highlightVocabRow(index),
            () => {
                this.playTrackButton.textContent = 'Track abspielen';
            }
        );
    }

    /**
     * Stoppt das Abspielen des Tracks
     */
    stopTrackPlayback() {
        this.audioPlayer.stopTrackPlayback();
        this.playTrackButton.textContent = 'Track abspielen';
    }


    // Neue Methode zur Initialisierung des Kartentrainers hinzufügen
initCardTrainer(vocabulary) {
    if (vocabulary && vocabulary.length > 0) {
        this.cardTrainer = new CardTrainer(vocabulary);
        this.cardTrainer.showCard();

        // Event-Listener für den Kartentrainer einrichten
        document.getElementById('flip-button').addEventListener('click',
            () => this.cardTrainer.flipCard());
        document.getElementById('known-button').addEventListener('click',
            () => this.cardTrainer.markAsKnown());
        document.getElementById('unknown-button').addEventListener('click',
            () => this.cardTrainer.markAsUnknown());

        // Audio-Button Event-Listener
        document.getElementById('de-audio-button')?.addEventListener('click', async () => {
            const speed = parseFloat(this.speedInput.value);
            const voice = this.voiceSelect.value;
            await this.cardTrainer.playCurrentAudio(this.apiClient, 'DE', speed, voice);
        });

        document.getElementById('vn-audio-button')?.addEventListener('click', async () => {
            const speed = parseFloat(this.speedInput.value);
            const voice = this.voiceSelect.value;
            await this.cardTrainer.playCurrentAudio(this.apiClient, 'VN', speed, voice);
        });

        return true;
    }
    return false;
}
}

// Anwendung initialisieren, nachdem das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    // Globales App-Objekt erstellen
    window.app = new VocabTrainerApp();
});
