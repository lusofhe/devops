/**
 * Verwaltet die Audio-Wiedergabe
 */
class AudioPlayerManager {
    constructor() {
        this.audioPlayer = document.getElementById('audio-player');
        this.generatedAudio = {}; // Geändertes Format: key = text_lang_speed_voice
        this.isPlaying = false;
        this.currentPlayIndex = 0;
        this.vocabulary = null;
    }

    /**
     * Setzt die aktuelle Vokabelliste
     * @param {Array} vocabulary - Vokabelliste
     */
    setVocabulary(vocabulary) {
        this.vocabulary = vocabulary;
        // Hash-Basiertes Caching - Cache nicht leeren bei Vokabelwechsel
        // damit die Audiodateien wiederverwendet werden können
    }

    /**
     * Erstellt einen eindeutigen Schlüssel für Audio-Caching
     * @param {string} text - Der zu sprechende Text
     * @param {string} language - Sprachcode ('deutsch' oder 'vietnamesisch')
     * @param {number} speed - Sprechgeschwindigkeit
     * @param {string} voice - Stimmentyp (MALE, FEMALE, NEUTRAL)
     * @returns {string} - Eindeutiger Cache-Schlüssel
     */
    createCacheKey(text, language, speed, voice) {
        return `${text}_${language}_${speed}_${voice}`;
    }

    /**
     * Fügt generierte Audio-URLs hinzu
     * @param {Object} entries - Liste mit Audio-URLs
     * @param {number} speed - Aktuelle Geschwindigkeit
     * @param {string} voice - Aktueller Stimmtyp
     */
addGeneratedAudio(entries, speed, voice) {
  entries.forEach(entry => {
    const deutschKey = this.createCacheKey(
      entry.DE.text,
      'DE',
      speed,
      voice
    );

    const vietnamesischKey = this.createCacheKey(
      entry.VN.text,
      'VN',
      speed,
      voice
    );

    this.generatedAudio[deutschKey] = entry.DE.audio;
    this.generatedAudio[vietnamesischKey] = entry.VN.audio;
  });
}


    /**
     * Spielt ein einzelnes Wort ab
     * @param {string} text - Der zu sprechende Text
     * @param {string} language - Sprachcode ('deutsch' oder 'vietnamesisch')
     * @param {number} speed - Sprechgeschwindigkeit
     * @param {string} voice - Stimmentyp (MALE, FEMALE, NEUTRAL)
     * @param {Function} generateAudioCallback - Callback zur Generierung neuer Audio
     * @returns {Promise} - Promise, das resolved, wenn das Audio fertig abgespielt wurde
     */
    async playWord(text, language, speed, voice, generateAudioCallback) {
        const cacheKey = this.createCacheKey(text, language, speed, voice);
        let audioUrl;

        // Prüfen, ob Audio bereits im Cache ist
        if (this.generatedAudio[cacheKey]) {
            console.log(`Cache Hit für "${text}" mit Geschwindigkeit ${speed}`);
            audioUrl = this.generatedAudio[cacheKey];
        } else {
            console.log(`Cache Miss für "${text}" mit Geschwindigkeit ${speed}`);
            // Audio generieren mit Callback-Funktion
            audioUrl = await generateAudioCallback(text, language, speed, voice);
            // Speichern im Cache mit dem neuen Format
            this.generatedAudio[cacheKey] = audioUrl;
        }

        return this.playAudio(audioUrl);
    }

    /**
     * Spielt eine Audio-Datei ab
     * @param {string} url - URL zur Audio-Datei
     * @returns {Promise} - Promise, das resolved, wenn das Audio fertig abgespielt wurde
     */
    async playAudio(url) {
        return new Promise((resolve, reject) => {
            this.audioPlayer.src = url;
            this.audioPlayer.onended = resolve;
            this.audioPlayer.onerror = reject;
            this.audioPlayer.play().catch(reject);
        });
    }

    /**
     * Startet die Wiedergabe aller Vokabeln
     * @param {Function} onHighlight - Callback-Funktion zum Hervorheben der aktuellen Zeile
     * @param {Function} onComplete - Callback-Funktion, die aufgerufen wird, wenn alle Vokabeln abgespielt wurden
     * @param {number} speed - Aktuelle Geschwindigkeit
     * @param {string} voice - Aktueller Stimmtyp
     */
    startPlayback(onHighlight, onComplete, speed, voice) {
        if (!this.vocabulary || this.vocabulary.length === 0) return;

        this.isPlaying = true;
        this.currentPlayIndex = 0;
        this.currentSpeed = speed;
        this.currentVoice = voice;
        this.playNext(onHighlight, onComplete);
    }

    /**
     * Spielt das nächste Wort ab
     * @param {Function} onHighlight - Callback-Funktion zum Hervorheben der aktuellen Zeile
     * @param {Function} onComplete - Callback-Funktion, die aufgerufen wird, wenn alle Vokabeln abgespielt wurden
     */
playNext(onHighlight, onComplete) {
  if (!this.isPlaying) return;

  if (this.currentPlayIndex >= this.vocabulary.length * 2) {
    // Alle Wörter wurden abgespielt
    this.stopPlayback();
    if (onComplete) onComplete();
    return;
  }

  const vocabIndex = Math.floor(this.currentPlayIndex / 2);
  const isVietnamese = this.currentPlayIndex % 2 === 1;

  const language = isVietnamese ? 'VN' : 'DE';
  const text = isVietnamese ? this.vocabulary[vocabIndex].VN : this.vocabulary[vocabIndex].DE;

  // Cache-Schlüssel mit aktueller Geschwindigkeit und Stimme
  const cacheKey = this.createCacheKey(text, language, this.currentSpeed, this.currentVoice);

  if (!this.generatedAudio[cacheKey]) {
    // Kein Audio vorhanden, zum nächsten Wort gehen
    this.currentPlayIndex++;
    this.playNext(onHighlight, onComplete);
    return;
  }

  // Hervorheben der aktuellen Zeile
  if (onHighlight) onHighlight(vocabIndex);

  // Audio abspielen
  this.audioPlayer.src = this.generatedAudio[cacheKey];
  this.audioPlayer.play();

  // Event-Listener für das Ende des Abspielens
  this.audioPlayer.onended = () => {
    setTimeout(() => {
      this.currentPlayIndex++;
      this.playNext(onHighlight, onComplete);
    }, isVietnamese ? 1000 : 500); // Längere Pause nach vietnamesischen Wörtern
  };
}



    /**
     * Stoppt die Wiedergabe
     */
    stopPlayback() {
        this.isPlaying = false;
        this.audioPlayer.pause();
    }

    /**
     * Gibt den aktuellen Wiedergabestatus zurück
     * @returns {boolean} - true, wenn gerade abgespielt wird, sonst false
     */
    getPlaybackStatus() {
        return this.isPlaying;
    }


    // public/js/audio-player.js (Ergänzung)
/**
 * Setzt den aktuellen Track
 * @param {Array} trackEntries - Die Track-Einträge
 */
setTrack(trackEntries) {
  this.trackEntries = trackEntries;
  this.currentTrackIndex = 0;
  this.currentSequenceIndex = 0;
  this.isPlayingTrack = false;
}

/**
 * Startet die Wiedergabe des Tracks
 * @param {Function} onHighlight - Callback-Funktion zum Hervorheben der aktuellen Zeile
 * @param {Function} onComplete - Callback-Funktion, die aufgerufen wird, wenn der Track abgespielt wurde
 */
startTrackPlayback(onHighlight, onComplete) {
  if (!this.trackEntries || this.trackEntries.length === 0) return;

  this.isPlayingTrack = true;
  this.currentTrackIndex = 0;
  this.currentSequenceIndex = 0;
  this.playNextTrackItem(onHighlight, onComplete);
}

/**
 * Spielt das nächste Element im Track ab
 * @param {Function} onHighlight - Callback-Funktion zum Hervorheben der aktuellen Zeile
 * @param {Function} onComplete - Callback-Funktion, die aufgerufen wird, wenn der Track abgespielt wurde
 */
playNextTrackItem(onHighlight, onComplete) {
  if (!this.isPlayingTrack) return;

  // Ende des Tracks erreicht?
  if (this.currentTrackIndex >= this.trackEntries.length) {
    this.stopTrackPlayback();
    if (onComplete) onComplete();
    return;
  }

  const currentEntry = this.trackEntries[this.currentTrackIndex];

  // Ende der Sequenz für diesen Eintrag erreicht?
  if (this.currentSequenceIndex >= currentEntry.sequence.length) {
    this.currentTrackIndex++;
    this.currentSequenceIndex = 0;
    this.playNextTrackItem(onHighlight, onComplete);
    return;
  }

  const sequenceItem = currentEntry.sequence[this.currentSequenceIndex];

  // Hervorheben der aktuellen Zeile
  if (onHighlight) onHighlight(this.currentTrackIndex);

  if (sequenceItem.type === 'pause') {
    // Bei einer Pause einfach warten
    setTimeout(() => {
      this.currentSequenceIndex++;
      this.playNextTrackItem(onHighlight, onComplete);
    }, sequenceItem.duration);
  } else if (sequenceItem.type === 'speech') {
    // Audio abspielen
    this.audioPlayer.src = sequenceItem.audio;
    this.audioPlayer.play();

    // Event-Listener für das Ende des Abspielens
    this.audioPlayer.onended = () => {
      this.currentSequenceIndex++;
      this.playNextTrackItem(onHighlight, onComplete);
    };
  }
}

/**
 * Stoppt die Wiedergabe des Tracks
 */
stopTrackPlayback() {
  this.isPlayingTrack = false;
  this.audioPlayer.pause();
}

/**
 * Gibt den aktuellen Track-Wiedergabestatus zurück
 * @returns {boolean} - true, wenn gerade ein Track abgespielt wird, sonst false
 */
getTrackPlaybackStatus() {
  return this.isPlayingTrack;
}




}

// Export als globale Variable
window.audioPlayerManager = new AudioPlayerManager();
